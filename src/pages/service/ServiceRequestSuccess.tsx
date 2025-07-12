import { useNavigate, useSearchParams } from "react-router-dom";
import { FiCheck, FiEye, FiHome } from "react-icons/fi";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { Button } from "../../components/UI";
import { SEOHead } from "../../components/SEO/SEOHead";

export default function ServiceRequestSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceTitle = searchParams.get("serviceTitle") || "the service";

  return (
    <>
      <SEOHead
        title="Service Request Sent Successfully - Sina.lk"
        description="Your service request has been sent successfully. The service provider will contact you soon."
        keywords="service request, success, confirmation, sina.lk"
      />
      
      <ResponsiveHeader />
      
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheck className="w-10 h-10 text-green-600" />
            </div>

            {/* Success Message */}
            <h1 className="text-2xl md:text-3xl font-bold text-[#0d0a0b] mb-4">
              Request Sent Successfully!
            </h1>
            
            <p className="text-lg text-[#454955] mb-6">
              Your service request for <span className="font-semibold text-[#0d0a0b]">"{serviceTitle}"</span> has been sent to the service provider.
            </p>

            {/* Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h2 className="font-semibold text-blue-900 mb-2">What happens next?</h2>
              <ul className="text-blue-800 text-sm space-y-1 text-left">
                <li>• The service provider will review your request</li>
                <li>• They will contact you within their specified response time</li>
                <li>• You can track the status of your request in your dashboard</li>
                <li>• You'll receive notifications about any updates</li>
              </ul>
            </div>

            {/* Dashboard Info */}
            <div className="bg-[#72b01d]/10 border border-[#72b01d]/20 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FiEye className="w-5 h-5 text-[#72b01d]" />
                <span className="font-semibold text-[#0d0a0b]">Track Your Request</span>
              </div>
              <p className="text-sm text-[#454955]">
                You can view the status of this request and communicate with the service provider from your dashboard.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                onClick={() => navigate("/dashboard?tab=requests")}
                className="flex items-center justify-center gap-2 px-6 py-3"
              >
                <FiEye className="w-4 h-4" />
                View My Requests
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => navigate("/")}
                className="flex items-center justify-center gap-2 px-6 py-3"
              >
                <FiHome className="w-4 h-4" />
                Back to Home
              </Button>
            </div>
          </div>

          {/* Additional Tips */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-[#0d0a0b] mb-4">💡 Helpful Tips</h3>
            <div className="space-y-3 text-sm text-[#454955]">
              <p>
                <strong>Response Time:</strong> Most service providers respond within 24 hours. Check their profile for specific response times.
              </p>
              <p>
                <strong>Communication:</strong> Once the provider responds, you can communicate with them directly using the contact information they provide.
              </p>
              <p>
                <strong>Service Agreement:</strong> After discussing your requirements, you and the provider will arrange the service details, pricing, and payment directly.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}
