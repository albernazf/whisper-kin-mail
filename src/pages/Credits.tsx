import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Mail, MessageSquare, Sparkles, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Profile {
  credits_physical: number;
  credits_digital: number;
  daily_digital_replies_used: number;
}

interface CreditPurchase {
  id: string;
  credit_type: 'physical' | 'digital';
  credits_purchased: number;
  amount_paid: number;
  status: string;
  created_at: string;
  completed_at?: string;
}

const Credits = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("credits_physical, credits_digital, daily_digital_replies_used")
        .eq("user_id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Get purchase history
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("credit_purchases")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (purchasesError) throw purchasesError;
      setPurchases(purchasesData as CreditPurchase[]);

    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (creditType: 'physical' | 'digital') => {
    setPurchasing(creditType);

    try {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { creditType, amount: 5.00 }
      });

      if (error) throw error;

      // Open Stripe checkout in new tab
      window.open(data.url, '_blank');

      toast({
        title: "Redirecting to payment...",
        description: "Complete your purchase in the new tab",
      });

    } catch (error: any) {
      toast({
        title: "Error starting purchase",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const getFreeRepliesLeft = () => {
    return 2 - (profile?.daily_digital_replies_used || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading credits...</p>
        </div>
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
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Credits & Purchases
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Current Credits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="card-magical">
            <CardHeader className="text-center">
              <Mail className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>Physical Credits</CardTitle>
              <CardDescription>For printed letters mailed to you</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {profile?.credits_physical || 0}
              </div>
              <p className="text-sm text-muted-foreground">Credits available</p>
            </CardContent>
          </Card>

          <Card className="card-magical">
            <CardHeader className="text-center">
              <MessageSquare className="h-12 w-12 text-secondary mx-auto mb-2" />
              <CardTitle>Digital Credits</CardTitle>
              <CardDescription>For instant digital replies</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">
                {profile?.credits_digital || 0}
              </div>
              <p className="text-sm text-muted-foreground">Credits available</p>
            </CardContent>
          </Card>

          <Card className="card-magical">
            <CardHeader className="text-center">
              <Sparkles className="h-12 w-12 text-accent mx-auto mb-2" />
              <CardTitle>Free Daily Replies</CardTitle>
              <CardDescription>Reset every day at midnight</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">
                {getFreeRepliesLeft()}
              </div>
              <p className="text-sm text-muted-foreground">Remaining today</p>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="card-magical">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Physical Credits</CardTitle>
                  <CardDescription className="text-lg">Perfect for special occasions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 rounded-xl p-4">
                <div className="text-3xl font-bold text-primary">$5.00</div>
                <div className="text-lg font-medium">5 Physical Credits</div>
                <div className="text-sm text-muted-foreground">$1.00 per letter</div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  High-quality printed letters
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Mailed directly to your address
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Perfect keepsakes from your creatures
                </li>
              </ul>
              <Button
                onClick={() => handlePurchase('physical')}
                disabled={purchasing === 'physical'}
                className="w-full btn-magical"
              >
                {purchasing === 'physical' ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy Physical Credits
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="card-magical">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-secondary" />
                <div>
                  <CardTitle className="text-2xl">Digital Credits</CardTitle>
                  <CardDescription className="text-lg">Great value for frequent chatting</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/10 rounded-xl p-4">
                <div className="text-3xl font-bold text-secondary">$5.00</div>
                <div className="text-lg font-medium">100 Digital Credits</div>
                <div className="text-sm text-muted-foreground">$0.05 per reply</div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  Instant delivery
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  Perfect for ongoing conversations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  Best value for regular chatting
                </li>
              </ul>
              <Button
                onClick={() => handlePurchase('digital')}
                disabled={purchasing === 'digital'}
                className="w-full btn-magical"
              >
                {purchasing === 'digital' ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy Digital Credits
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Purchase History */}
        {purchases.length > 0 && (
          <Card className="card-magical">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Recent Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      {purchase.credit_type === 'physical' ? (
                        <Mail className="h-8 w-8 text-primary" />
                      ) : (
                        <MessageSquare className="h-8 w-8 text-secondary" />
                      )}
                      <div>
                        <div className="font-medium">
                          {purchase.credits_purchased} {purchase.credit_type} credits
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(purchase.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${purchase.amount_paid.toFixed(2)}</div>
                      <Badge 
                        variant={purchase.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {purchase.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Credits;