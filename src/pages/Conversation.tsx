import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Mail, MessageSquare, Sparkles, Heart, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  sender_type: 'user' | 'creature';
  content: string;
  delivery_type: 'digital' | 'physical';
  status: string;
  created_at: string;
  physical_letter_image_url?: string;
  context_notes?: string;
  generation_cost: number;
}

interface Creature {
  id: string;
  name: string;
  image_url?: string;
  backstory?: string;
  conversation_state: string;
}

interface Profile {
  credits_physical: number;
  credits_digital: number;
  daily_digital_replies_used: number;
}

const Conversation = () => {
  const { creatureId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [creature, setCreature] = useState<Creature | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [replyForm, setReplyForm] = useState({
    message: "",
    contextNotes: "",
    replyType: "digital" as "digital" | "physical"
  });

  useEffect(() => {
    if (creatureId && user) {
      fetchConversationData();
    }
  }, [creatureId, user]);

  const fetchConversationData = async () => {
    try {
      // Get creature
      const { data: creatureData, error: creatureError } = await supabase
        .from("creatures")
        .select("*")
        .eq("id", creatureId)
        .single();

      if (creatureError) throw creatureError;
      setCreature(creatureData);

      // Get or create conversation
      let { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("creature_id", creatureId)
        .eq("user_id", user?.id)
        .single();

      if (convError && convError.code === 'PGRST116') {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from("conversations")
          .insert({
            creature_id: creatureId,
            user_id: user?.id,
            started_by: "user"
          })
          .select()
          .single();

        if (createError) throw createError;
        conversation = newConv;
      } else if (convError) {
        throw convError;
      }

      setConversationId(conversation.id);

      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData as Message[]);

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("credits_physical, credits_digital, daily_digital_replies_used")
        .eq("user_id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

    } catch (error: any) {
      toast({
        title: "Error loading conversation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyForm.message.trim() || !conversationId) return;

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-letter', {
        body: {
          conversationId,
          userMessage: replyForm.message,
          contextNotes: replyForm.contextNotes,
          replyType: replyForm.replyType,
          creatureId
        }
      });

      if (error) throw error;

      toast({
        title: "Letter sent! ✨",
        description: data.usedFreeReply 
          ? "Used one of your free daily replies!" 
          : `Used ${data.costCredits} ${replyForm.replyType} credit(s)`,
      });

      // Reset form
      setReplyForm({
        message: "",
        contextNotes: "",
        replyType: "digital"
      });

      // Refresh data
      fetchConversationData();

    } catch (error: any) {
      toast({
        title: "Error sending letter",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const canSendDigital = () => {
    if (!profile) return false;
    const freeRepliesLeft = 2 - (profile.daily_digital_replies_used || 0);
    return freeRepliesLeft > 0 || profile.credits_digital > 0;
  };

  const canSendPhysical = () => {
    return profile && profile.credits_physical > 0;
  };

  const getDigitalReplyInfo = () => {
    if (!profile) return "";
    const freeRepliesLeft = 2 - (profile.daily_digital_replies_used || 0);
    if (freeRepliesLeft > 0) {
      return `${freeRepliesLeft} free replies left today`;
    }
    return `${profile.credits_digital} digital credits available`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!creature) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/10 flex items-center justify-center">
        <Card className="card-magical max-w-md">
          <CardContent className="text-center pt-6">
            <p className="text-lg text-muted-foreground mb-4">Creature not found</p>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4 flex-1">
            {creature.image_url && (
              <img
                src={creature.image_url}
                alt={creature.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {creature.name}
              </h1>
              <p className="text-sm text-muted-foreground">Fantasy Letters Conversation</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-card/70 rounded-2xl px-4 py-2 border border-primary/20">
              <div className="text-xs text-muted-foreground">Credits</div>
              <div className="flex gap-3 text-sm font-medium">
                <span className="text-primary">{profile?.credits_physical || 0} Physical</span>
                <span className="text-secondary">{profile?.credits_digital || 0} Digital</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Messages */}
        <div className="space-y-6 mb-8">
          {messages.length === 0 ? (
            <Card className="card-magical text-center">
              <CardContent className="pt-8 pb-8">
                <Heart className="h-16 w-16 text-primary/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Start Your First Letter!</h3>
                <p className="text-muted-foreground">
                  Write your first message to {creature.name} below. They're excited to hear from you!
                </p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-2xl ${
                  message.sender_type === 'user' 
                    ? 'bg-primary/10 border-primary/20' 
                    : 'card-magical'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {message.sender_type === 'creature' ? (
                          <>
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-medium">{creature.name}</span>
                          </>
                        ) : (
                          <>
                            <Heart className="h-4 w-4 text-secondary" />
                            <span className="font-medium">You</span>
                          </>
                        )}
                        <Badge variant={message.delivery_type === 'physical' ? 'default' : 'secondary'}>
                          {message.delivery_type === 'physical' ? (
                            <><Mail className="h-3 w-3 mr-1" />Physical</>
                          ) : (
                            <><MessageSquare className="h-3 w-3 mr-1" />Digital</>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(message.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {message.physical_letter_image_url && (
                      <img
                        src={message.physical_letter_image_url}
                        alt="Scanned letter"
                        className="w-full rounded-lg mb-4 border"
                      />
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    {message.context_notes && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Context:</strong> {message.context_notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>

        {/* Reply Form */}
        <Card className="card-magical">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Write a Letter to {creature.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendReply} className="space-y-6">
              <div>
                <Label htmlFor="message" className="text-base font-medium">
                  Your Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Dear Luna, I wanted to tell you about my day..."
                  value={replyForm.message}
                  onChange={(e) => setReplyForm({ ...replyForm, message: e.target.value })}
                  className="min-h-32 mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="context" className="text-base font-medium">
                  Context Notes (Optional)
                </Label>
                <Input
                  id="context"
                  placeholder="e.g., Had a math test today, going to grandma's this weekend..."
                  value={replyForm.contextNotes}
                  onChange={(e) => setReplyForm({ ...replyForm, contextNotes: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Help {creature.name} write a more personalized response
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium">Reply Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      type="button"
                      variant={replyForm.replyType === 'digital' ? 'default' : 'outline'}
                      onClick={() => setReplyForm({ ...replyForm, replyType: 'digital' })}
                      disabled={!canSendDigital()}
                      className="h-16 flex-col"
                    >
                      <MessageSquare className="h-5 w-5 mb-1" />
                      <span className="text-xs">Digital</span>
                    </Button>
                    <Button
                      type="button"
                      variant={replyForm.replyType === 'physical' ? 'default' : 'outline'}
                      onClick={() => setReplyForm({ ...replyForm, replyType: 'physical' })}
                      disabled={!canSendPhysical()}
                      className="h-16 flex-col"
                    >
                      <Mail className="h-5 w-5 mb-1" />
                      <span className="text-xs">Physical</span>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="text-sm text-muted-foreground">
                    {replyForm.replyType === 'digital' ? (
                      <div>
                        <p className="font-medium">{getDigitalReplyInfo()}</p>
                        <p>Instant delivery</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">{profile?.credits_physical || 0} physical credits</p>
                        <p>Printed and mailed to you</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={sending || !replyForm.message.trim() || 
                  (replyForm.replyType === 'digital' && !canSendDigital()) ||
                  (replyForm.replyType === 'physical' && !canSendPhysical())
                }
                className="w-full btn-magical text-lg py-4"
              >
                {sending ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    Sending Letter...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send {replyForm.replyType === 'physical' ? 'Physical' : 'Digital'} Letter
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Conversation;