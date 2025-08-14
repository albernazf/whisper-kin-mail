import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Mail, Heart, Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-6xl mb-6">
            <Sparkles className="h-16 w-16 text-primary animate-pulse" />
            <span className="bg-gradient-to-r from-primary via-secondary to-primary-glow bg-clip-text text-transparent font-bold">
              Fantasy Letters
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-foreground">
            Create magical creatures and exchange letters with them!
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            A wonderful world where children can create fantasy creatures like dragons, unicorns, and fairies, 
            then write letters and receive magical responses back. Perfect for sparking imagination and creativity!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/auth')}
              className="btn-magical text-lg px-8 py-4 rounded-2xl"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Start Your Adventure
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-4 rounded-2xl border-primary/30 hover:bg-primary/10"
            >
              <Mail className="h-5 w-5 mr-2" />
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="card-magical text-center">
            <CardHeader>
              <div className="text-4xl mb-4">🐉</div>
              <CardTitle className="text-xl">Create Creatures</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Design your own magical creatures with unique names, appearances, and backstories. 
                Each creature has their own personality!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="card-magical text-center">
            <CardHeader>
              <div className="text-4xl mb-4">✉️</div>
              <CardTitle className="text-xl">Exchange Letters</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Write physical letters to your creatures and receive magical responses back. 
                Choose between digital or physical mail delivery!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="card-magical text-center">
            <CardHeader>
              <div className="text-4xl mb-4">✨</div>
              <CardTitle className="text-xl">Spark Imagination</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Foster creativity and writing skills through magical correspondence. 
                Perfect for children ages 6-12!
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            How It Works
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold mb-2">Create Account</h4>
              <p className="text-sm text-muted-foreground">Sign up with parental permission</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-secondary">2</span>
              </div>
              <h4 className="font-semibold mb-2">Design Creature</h4>
              <p className="text-sm text-muted-foreground">Create your magical friend</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-accent-foreground">3</span>
              </div>
              <h4 className="font-semibold mb-2">Write Letters</h4>
              <p className="text-sm text-muted-foreground">Send physical or digital letters</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">4</span>
              </div>
              <h4 className="font-semibold mb-2">Get Replies</h4>
              <p className="text-sm text-muted-foreground">Receive magical responses back</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="card-magical max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              Ready for a Magical Adventure?
              <Star className="h-6 w-6 text-yellow-500" />
            </CardTitle>
            <CardDescription className="text-lg">
              Join thousands of children already exchanging letters with their fantasy creatures!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/auth')}
              className="btn-magical text-xl px-12 py-6 rounded-2xl"
            >
              <Sparkles className="h-6 w-6 mr-2" />
              Start Creating Magic Now!
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
