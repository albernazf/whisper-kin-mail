import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Sparkles, Image as ImageIcon } from "lucide-react";

const CreateCreature = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    backstory: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('creature-images')
      .upload(fileName, imageFile);

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('creature-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please give your creature a name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          throw new Error("Failed to upload image");
        }
      }

      // Create creature
      const { data, error } = await supabase
        .from("creatures")
        .insert({
          name: formData.name.trim(),
          backstory: formData.backstory.trim() || null,
          image_url: imageUrl,
          user_id: user?.id,
          conversation_state: "idle",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Creature created! 🎉",
        description: `${formData.name} has been brought to life!`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating creature:", error);
      toast({
        title: "Error creating creature",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Create Your Creature
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="card-magical">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl bg-gradient-to-r from-primary via-secondary to-primary-glow bg-clip-text text-transparent">
                Bring Your Creature to Life! ✨
              </CardTitle>
              <CardDescription className="text-lg">
                Design a magical creature that will become your pen pal and write letters back to you.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Image Upload */}
                <div className="space-y-4">
                  <Label htmlFor="image" className="text-lg font-semibold">
                    Creature Image (Optional)
                  </Label>
                  <div className="flex flex-col items-center space-y-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Creature preview"
                          className="w-48 h-48 object-cover rounded-2xl border-4 border-primary/20 shadow-lg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute -top-2 -right-2 rounded-full"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="w-48 h-48 border-2 border-dashed border-muted-foreground/30 rounded-2xl flex flex-col items-center justify-center bg-muted/20">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground text-center">
                          No image selected
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Label
                        htmlFor="image"
                        className="cursor-pointer inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-xl font-medium transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        Choose Image
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Max 5MB • JPG, PNG, WebP
                      </p>
                    </div>
                  </div>
                </div>

                {/* Creature Name */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-lg font-semibold">
                    Creature Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Luna the Dragon, Pip the Forest Sprite..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-lg py-6 rounded-xl border-2 focus:border-primary"
                    maxLength={50}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.name.length}/50 characters
                  </p>
                </div>

                {/* Backstory */}
                <div className="space-y-3">
                  <Label htmlFor="backstory" className="text-lg font-semibold">
                    Backstory (Optional)
                  </Label>
                  <Textarea
                    id="backstory"
                    placeholder="Tell us about your creature's personality, where they live, what they love to do, their magical abilities... The more detail you provide, the more unique their letters will be!"
                    value={formData.backstory}
                    onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
                    className="min-h-32 text-base rounded-xl border-2 focus:border-primary resize-none"
                    maxLength={1000}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.backstory.length}/1000 characters
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !formData.name.trim()}
                    className="w-full btn-magical text-lg py-6 rounded-2xl"
                  >
                    {loading ? (
                      <>
                        <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                        Creating Your Creature...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Create Creature
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateCreature;