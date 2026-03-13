import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Mail, Phone, MapPin, Globe, Facebook, Twitter, Linkedin, Github, MessageCircle, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Developer {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  facebook_url: string | null;
  whatsapp_url: string | null;
  telegram_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
}

const DeveloperDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeveloper = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("developers")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        console.error("Error fetching developer:", error);
      } else {
        setDeveloper(data as Developer);
      }
      setLoading(false);
    };

    fetchDeveloper();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h1 className="text-2xl font-bold text-foreground mb-2">Developer Not Found</h1>
              <p className="text-muted-foreground mb-4">The developer you're looking for doesn't exist or is not active.</p>
              <Button asChild>
                <Link to="/">Go Back Home</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  const socialLinks = [
    { platform: "Facebook", url: developer.facebook_url, icon: Facebook, color: "text-blue-600" },
    { platform: "WhatsApp", url: developer.whatsapp_url, icon: MessageCircle, color: "text-green-600" },
    { platform: "Telegram", url: developer.telegram_url, icon: Send, color: "text-blue-500" },
    { platform: "GitHub", url: developer.github_url, icon: Github, color: "text-foreground" },
    { platform: "LinkedIn", url: developer.linkedin_url, icon: Linkedin, color: "text-blue-700" },
    { platform: "Twitter", url: developer.twitter_url, icon: Twitter, color: "text-blue-400" },
  ].filter(link => link.url);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        {/* Developer Profile Card */}
        <Card className="overflow-hidden shadow-xl">
          <CardContent className="p-0">
            {/* Header with Gradient Background */}
            <div className="bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 p-8 text-center">
              {/* Profile Image */}
              <div className="relative inline-block mb-4">
                {developer.image_url ? (
                  <img
                    src={developer.image_url}
                    alt={developer.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-primary-foreground border-4 border-background shadow-lg">
                    {developer.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <Badge className="absolute bottom-0 right-0 px-3 py-1 text-sm bg-primary">
                  {developer.role}
                </Badge>
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-2">{developer.name}</h1>
              <p className="text-muted-foreground text-sm">{developer.role}</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Bio */}
              {developer.bio && (
                <section>
                  <h2 className="text-lg font-bold text-foreground mb-2">About</h2>
                  <p className="text-muted-foreground leading-relaxed">{developer.bio}</p>
                </section>
              )}

              {/* Contact Information */}
              {(developer.email || developer.phone) && (
                <section>
                  <h2 className="text-lg font-bold text-foreground mb-3">Contact Information</h2>
                  <div className="space-y-2">
                    {developer.email && (
                      <a href={`mailto:${developer.email}`} className="flex items-center gap-3 p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors">
                        <Mail className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">{developer.email}</span>
                      </a>
                    )}
                    {developer.phone && (
                      <a href={`tel:${developer.phone}`} className="flex items-center gap-3 p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors">
                        <Phone className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">{developer.phone}</span>
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-foreground mb-3">Connect With Me</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {socialLinks.map((link) => (
                      <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
                      >
                        <link.icon className={`h-5 w-5 ${link.color} group-hover:scale-110 transition-transform`} />
                        <span className="text-sm font-medium text-foreground">{link.platform}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Call to Action */}
              <div className="pt-4 border-t border-border">
                <div className="flex flex-col sm:flex-row gap-3">
                  {developer.email && (
                    <Button asChild className="flex-1">
                      <a href={`mailto:${developer.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </a>
                    </Button>
                  )}
                  {developer.whatsapp_url && (
                    <Button asChild variant="outline" className="flex-1">
                      <a href={developer.whatsapp_url} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default DeveloperDetail;
