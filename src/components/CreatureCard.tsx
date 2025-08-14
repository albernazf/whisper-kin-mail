import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, Clock, Mail } from "lucide-react";

interface Creature {
  id: string;
  name: string;
  image_url?: string;
  backstory?: string;
  conversation_state: "idle" | "waiting_for_letter" | "pending_response";
  created_at: string;
}

interface CreatureCardProps {
  creature: Creature;
  onStartConversation: (creatureId: string) => void;
  onViewConversation: (creatureId: string) => void;
}

const CreatureCard = ({ creature, onStartConversation, onViewConversation }: CreatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusBadge = () => {
    switch (creature.conversation_state) {
      case "idle":
        return (
          <Badge variant="secondary" className="status-idle">
            <Sparkles className="h-3 w-3 mr-1" />
            Ready to chat
          </Badge>
        );
      case "waiting_for_letter":
        return (
          <Badge className="status-waiting">
            <Mail className="h-3 w-3 mr-1" />
            Waiting for your letter
          </Badge>
        );
      case "pending_response":
        return (
          <Badge className="status-pending">
            <Clock className="h-3 w-3 mr-1" />
            Writing back to you
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCreatureImage = () => {
    if (creature.image_url) {
      return creature.image_url;
    }
    
    // Default creature images based on name or random
    const defaultImages = [
      "🐉", "🦄", "🧚‍♀️", "🐲", "🦅", "🐺", "🦋", "🐸", "🦊", "🦔"
    ];
    const imageIndex = creature.name.length % defaultImages.length;
    return defaultImages[imageIndex];
  };

  return (
    <Card 
      className="card-magical cursor-pointer transition-all duration-300 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 text-6xl select-none group-hover:scale-110 transition-transform duration-300">
          {typeof getCreatureImage() === 'string' && getCreatureImage().startsWith('http') ? (
            <img 
              src={getCreatureImage()} 
              alt={creature.name}
              className="w-20 h-20 rounded-full object-cover mx-auto"
            />
          ) : (
            <div className="text-6xl">{getCreatureImage()}</div>
          )}
        </div>
        <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          {creature.name}
        </CardTitle>
        <div className="flex justify-center">
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {creature.backstory && (
          <CardDescription className="text-center line-clamp-3">
            {creature.backstory}
          </CardDescription>
        )}
        
        <div className="flex flex-col gap-2">
          {creature.conversation_state === "idle" ? (
            <Button
              onClick={() => onStartConversation(creature.id)}
              className="btn-magical w-full rounded-xl"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Conversation
            </Button>
          ) : (
            <Button
              onClick={() => onViewConversation(creature.id)}
              variant="outline"
              className="w-full rounded-xl border-primary/30 hover:bg-primary/10"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              View Conversation
            </Button>
          )}
        </div>
        
        {isHovered && (
          <div className="text-xs text-muted-foreground text-center opacity-0 animate-fade-in">
            Created {new Date(creature.created_at).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreatureCard;