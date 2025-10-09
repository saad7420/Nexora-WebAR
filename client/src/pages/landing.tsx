import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Box, 
  Eye, 
  QrCode, 
  ChartLine, 
  Users, 
  Tags, 
  Smartphone,
  Upload,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  Twitter,
  Linkedin,
  Github
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const features = [
    {
      icon: Upload,
      title: "Instant Upload & Conversion",
      description: "Upload .glb, .fbx, .obj files and get optimized WebAR experiences in minutes. Automatic texture compression and LOD generation.",
      color: "text-primary"
    },
    {
      icon: QrCode,
      title: "QR Code & Link Generation", 
      description: "Generate beautiful QR codes and short links instantly. Perfect for menus, table tents, and digital marketing.",
      color: "text-accent"
    },
    {
      icon: ChartLine,
      title: "Advanced Analytics",
      description: "Track AR views, session duration, hotspot interactions, and customer engagement with detailed insights.",
      color: "text-gold"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite team members, assign roles, and collaborate seamlessly across multiple workspaces and projects.",
      color: "text-primary"
    },
    {
      icon: Tags,
      title: "Smart Annotations",
      description: "Add ingredient details, allergen info, pricing, and interactive hotspots directly on your 3D models.",
      color: "text-accent"
    },
    {
      icon: Smartphone,
      title: "Universal WebAR",
      description: "Works on iOS Safari, Android Chrome, and all modern browsers. No app installation required.",
      color: "text-gold"
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      description: "Perfect for small restaurants",
      price: 49,
      features: [
        "Up to 25 AR models",
        "5,000 AR views/month", 
        "Basic analytics",
        "2 team members",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Professional",
      description: "For growing businesses",
      price: 149,
      features: [
        "Up to 100 AR models",
        "25,000 AR views/month",
        "Advanced analytics", 
        "10 team members",
        "Priority support",
        "Custom branding"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      description: "For large organizations",
      price: "Custom",
      features: [
        "Unlimited AR models",
        "Unlimited AR views",
        "Custom analytics",
        "Unlimited team members", 
        "Dedicated support",
        "API access"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Box className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold gradient-text">Nexora</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#demo" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Demo
              </a>
              <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleLogin} data-testid="login-button">
                Login
              </Button>
              <Button onClick={handleLogin} className="btn-primary animate-glow" data-testid="get-started-button">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-card rounded-full border border-border mb-8">
                <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Trusted by 500+ restaurants worldwide</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
                Transform Your Menu Into <span className="gradient-text">Immersive AR</span> Experiences
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Upload 3D models of your dishes and instantly generate WebAR experiences. Let customers visualize meals in their space before ordering.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-12">
                <Button onClick={handleLogin} size="lg" className="btn-primary text-lg px-8 py-4" data-testid="hero-start-trial">
                  Start Free Trial
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-4" data-testid="hero-watch-demo">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex items-center space-x-8">
                <div>
                  <div className="text-3xl font-bold text-gold">98%</div>
                  <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <div className="text-3xl font-bold text-accent">50K+</div>
                  <div className="text-sm text-muted-foreground">AR Views Daily</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Support Available</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <Card className="glass-card p-8 shadow-2xl hover-lift animate-float">
                <div className="aspect-square bg-secondary rounded-xl flex items-center justify-center mb-6 relative overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Box className="w-24 h-24 text-primary/80" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between text-sm">
                      <Badge className="bg-gold/20 text-gold">Premium</Badge>
                      <span className="text-muted-foreground">$24.99</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Signature Burger</h3>
                  <Button size="icon" variant="ghost" className="hover:bg-primary/10">
                    <Box className="w-5 h-5 text-primary" />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6">
                  Angus beef, aged cheddar, caramelized onions, truffle aioli
                </p>
                
                <Button className="w-full btn-primary" data-testid="view-in-ar-demo">
                  <Smartphone className="w-4 h-4 mr-2" />
                  View in AR
                </Button>
              </Card>
              
              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/20 rounded-full blur-3xl animate-float" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              Everything You Need for <span className="gradient-text">AR Success</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to transform how customers experience your menu
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover-lift border-border bg-card/60 backdrop-blur-xl" data-testid={`feature-card-${index}`}>
                <CardHeader>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-${feature.color.split('-')[1]}/20`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              Choose Your <span className="gradient-text">Perfect Plan</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Flexible pricing that grows with your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`hover-lift relative ${plan.popular ? 'border-primary border-2 bg-gradient-to-br from-primary/10 to-accent/10' : 'border-border bg-card'}`}
                data-testid={`pricing-plan-${index}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gold text-background">MOST POPULAR</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-6">
                    <div className="text-4xl font-bold">
                      {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                      {typeof plan.price === 'number' && (
                        <span className="text-lg text-muted-foreground font-normal">/mo</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.popular ? 'btn-primary' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                    onClick={handleLogin}
                    data-testid={`pricing-get-started-${index}`}
                  >
                    {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              Get In <span className="gradient-text">Touch</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          <Card className="glass-card p-8 lg:p-12 border border-border">
            <form className="space-y-6" data-testid="contact-form">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    className="mt-2"
                    data-testid="input-firstName"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    className="mt-2"
                    data-testid="input-lastName"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@restaurant.com" 
                  className="mt-2"
                  data-testid="input-email"
                />
              </div>
              
              <div>
                <Label htmlFor="company">Company</Label>
                <Input 
                  id="company" 
                  placeholder="Bella Italia Restaurant" 
                  className="mt-2"
                  data-testid="input-company"
                />
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  rows={5} 
                  placeholder="Tell us about your project..." 
                  className="mt-2"
                  data-testid="textarea-message"
                />
              </div>
              
              <Button 
                type="submit" 
                size="lg" 
                className="w-full btn-primary text-lg py-4"
                data-testid="button-send-message"
              >
                Send Message
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Box className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-display font-bold">Nexora</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transform your menu into immersive AR experiences.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Nexora by CodeLixi. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
