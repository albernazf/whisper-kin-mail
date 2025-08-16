import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Save, Mail, MessageSquare, Search, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PendingConversation {
  id: string;
  creature_name: string;
  user_email: string;
  last_message_at: string;
  message_count: number;
}

interface DigitizeForm {
  conversationId: string;
  letterContent: string;
  scannedImageUrl: string;
  adminNotes: string;
}

const Admin = () => {
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<PendingConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  const [digitizeForm, setDigitizeForm] = useState<DigitizeForm>({
    conversationId: "",
    letterContent: "",
    scannedImageUrl: "",
    adminNotes: ""
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingConversations();
  }, []);

  const fetchPendingConversations = async () => {
    try {
      // Get conversations that might need physical letter digitization
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          last_message_at,
          creatures!inner (
            name
          ),
          profiles!inner (
            email
          )
        `)
        .order('last_message_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Transform the data
      const transformedData: PendingConversation[] = data.map((conv: any) => ({
        id: conv.id,
        creature_name: conv.creatures.name,
        user_email: conv.profiles.email,
        last_message_at: conv.last_message_at,
        message_count: 0 // We'll fetch this separately if needed
      }));

      setConversations(transformedData);

    } catch (error: any) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `admin/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('creature-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('creature-images')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDigitizeLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!digitizeForm.conversationId || !digitizeForm.letterContent.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a conversation and enter the letter content",
        variant: "destructive",
      });
      return;
    }

    setProcessing(digitizeForm.conversationId);

    try {
      let imageUrl = digitizeForm.scannedImageUrl;

      // Upload image if file is selected
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile) || "";
      }

      const { data, error } = await supabase.functions.invoke('digitize-letter', {
        body: {
          conversationId: digitizeForm.conversationId,
          letterContent: digitizeForm.letterContent,
          scannedImageUrl: imageUrl,
          adminNotes: digitizeForm.adminNotes
        }
      });

      if (error) throw error;

      toast({
        title: "Letter digitized successfully! ✨",
        description: "The physical letter has been added to the conversation",
      });

      // Reset form
      setDigitizeForm({
        conversationId: "",
        letterContent: "",
        scannedImageUrl: "",
        adminNotes: ""
      });
      setImageFile(null);
      setImagePreview(null);

      // Refresh conversations
      fetchPendingConversations();

    } catch (error: any) {
      toast({
        title: "Error digitizing letter",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const selectConversation = (conversation: PendingConversation) => {
    setDigitizeForm({
      ...digitizeForm,
      conversationId: conversation.id
    });
  };

  const openConversation = (conversationId: string) => {
    // This would navigate to view the conversation
    // For now, we'll just show a toast
    toast({
      title: "View Conversation",
      description: "Feature coming soon - conversation viewer",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <Mail className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-sm text-muted-foreground">
                Digitize physical letters and manage conversations
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Conversations List */}
          <Card className="card-magical">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Recent Conversations
              </CardTitle>
              <CardDescription>
                Select a conversation to digitize a physical letter
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      digitizeForm.conversationId === conversation.id
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50 bg-muted/20'
                    }`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{conversation.creature_name}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openConversation(conversation.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      User: {conversation.user_email}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Last activity: {new Date(conversation.last_message_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {conversations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No conversations found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Digitize Form */}
          <Card className="card-magical">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Digitize Physical Letter
              </CardTitle>
              <CardDescription>
                Upload scanned letter and transcribe content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDigitizeLetter} className="space-y-6">
                {/* Selected Conversation */}
                <div>
                  <Label className="text-base font-medium">Selected Conversation</Label>
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    {digitizeForm.conversationId ? (
                      <div className="text-sm">
                        {conversations.find(c => c.id === digitizeForm.conversationId)?.creature_name || 'Unknown'}
                        <Badge variant="secondary" className="ml-2">Selected</Badge>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Select a conversation from the list
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <Label className="text-base font-medium">Scanned Letter Image (Optional)</Label>
                  <div className="mt-2 space-y-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Letter preview"
                          className="w-full max-w-md rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          No image selected
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="letter-image"
                      />
                      <Label
                        htmlFor="letter-image"
                        className="cursor-pointer inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-xl font-medium transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        Choose Image
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Letter Content */}
                <div>
                  <Label htmlFor="content" className="text-base font-medium">
                    Letter Content *
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Type the complete content of the physical letter here..."
                    value={digitizeForm.letterContent}
                    onChange={(e) => setDigitizeForm({ ...digitizeForm, letterContent: e.target.value })}
                    className="min-h-32 mt-2"
                    required
                  />
                </div>

                {/* Admin Notes */}
                <div>
                  <Label htmlFor="notes" className="text-base font-medium">
                    Admin Notes (Optional)
                  </Label>
                  <Input
                    id="notes"
                    placeholder="Any special notes about this letter..."
                    value={digitizeForm.adminNotes}
                    onChange={(e) => setDigitizeForm({ ...digitizeForm, adminNotes: e.target.value })}
                    className="mt-2"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={processing !== null || !digitizeForm.conversationId || !digitizeForm.letterContent.trim()}
                  className="w-full btn-magical text-lg py-4"
                >
                  {processing ? (
                    <>
                      <Mail className="h-5 w-5 mr-2 animate-pulse" />
                      Processing Letter...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Digitize Letter
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;