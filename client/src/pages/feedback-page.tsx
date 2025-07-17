import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { FeedbackForm } from "@/components/feedback-form";
import { MessageSquare, Bug, Lightbulb, HelpCircle } from "lucide-react";

export default function FeedbackPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-grow pb-20 md:pb-6">
        <div className="p-4 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 text-foreground flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Feedback
            </h2>
            <p className="text-muted-foreground">
              Help us improve the Animal Impact Tracker by sharing your thoughts, reporting issues, or suggesting new features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feedback Form */}
            <div className="lg:col-span-2">
              <FeedbackForm />
            </div>
            
            {/* Information Card */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">How to Provide Feedback</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Bug className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Bug Reports</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Report issues, errors, or unexpected behavior. Include steps to reproduce the problem.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Feature Suggestions</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Share ideas for new features or improvements to existing functionality.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Questions</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ask questions about how to use features or clarify impact calculations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">What Happens Next?</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    • Your feedback is stored securely and privately
                  </p>
                  <p>
                    • We compile feedback weekly and review all submissions
                  </p>
                  <p>
                    • For urgent issues, we may respond directly if you provide contact information
                  </p>
                  <p>
                    • Feature suggestions are prioritized based on user demand and impact
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
                <p className="text-sm text-muted-foreground">
                  Your feedback helps us build a better tool for animal advocates. 
                  Every suggestion and bug report contributes to improving the impact tracking experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}