import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import CreatureCard from "@/components/CreatureCard";
import { Plus, Sparkles, LogOut, User, CreditCard } from "lucide-react";

interface Creature {
  id: string;
  name: string;
  image_url?: string;
  backstory?: string;
  conversation_state: "idle" | "waiting_for_letter" | "pending_response";
  created_at: string;
}

interface Profile {
  credits_physical: number;
  credits_digital: number;
  name?: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCreatures();
      fetchProfile();
    }
  }, [user]);

  const fetchCreatures = async () => {
    try {
      const { data, error } = await supabase
        .from("creatures")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCreatures(data as Creature[] || []);
    } catch (error: any) {
      toast({
        title: "Error loading creatures",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("credits_physical, credits_digital, name")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error loading profile:", error);
    }
  };

  const handleStartConversation = async (creatureId: string) => {
    try {
      // Update creature status to waiting_for_letter
      const { error } = await supabase
        .from("creatures")
        .update({ conversation_state: "waiting_for_letter" })
        .eq("id", creatureId);

      if (error) throw error;

      // Create a new conversation
      const { error: conversationError } = await supabase
        .from("conversations")
        .insert({
          creature_id: creatureId,
          user_id: user?.id,
          started_by: "user",
        });

      if (conversationError) throw conversationError;

      toast({
        title: "Conversation started! 🌟",
        description: "Your creature is now waiting for your first letter!",
      });

      fetchCreatures(); // Refresh creatures
      navigate(`/creatures/${creatureId}`);
    } catch (error: any) {
      toast({
        title: "Error starting conversation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewConversation = (creatureId: string) => {
    navigate(`/creatures/${creatureId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading your magical world...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Fantasy Letters
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {profile?.name || user?.email?.split('@')[0]}!
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Credits Display */}
            {profile && (
              <div className="flex items-center gap-4 bg-card/70 rounded-2xl px-4 py-2 border border-primary/20">
                <div className="text-center">
                  <div className="text-sm font-bold text-primary">{profile.credits_physical}</div>
                  <div className="text-xs text-muted-foreground">Physical</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-secondary">{profile.credits_digital}</div>
                  <div className="text-xs text-muted-foreground">Digital</div>
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={() => navigate('/credits')}
              className="rounded-xl"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Buy Credits
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
              className="rounded-xl"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            
            <Button
              variant="outline"
              onClick={signOut}
              className="rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary-glow bg-clip-text text-transparent">
            Your Magical Creatures
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create fantastical creatures and exchange letters with them! Each creature has their own personality and will write back to you.
          </p>
        </div>

        {/* Creatures Grid */}
        {creatures.length === 0 ? (
          <Card className="card-magical max-w-2xl mx-auto text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Create Your First Creature! 🐉</CardTitle>
              <CardDescription className="text-lg">
                Start your magical journey by creating a fantasy creature to exchange letters with.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/creatures/create')}
                className="btn-magical text-lg px-8 py-4 rounded-2xl"
              >
                <Plus className="h-6 w-6 mr-2" />
                Create My First Creature
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-semibold">Your Creatures ({creatures.length})</h3>
              <Button
                onClick={() => navigate('/creatures/create')}
                className="btn-magical rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Creature
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creatures.map((creature) => (
                <CreatureCard
                  key={creature.id}
                  creature={creature}
                  onStartConversation={handleStartConversation}
                  onViewConversation={handleViewConversation}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;