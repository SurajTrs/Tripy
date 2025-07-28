
'use client';

export default function Footer() {
  const footerLinks = {
    'Product': ['Features', 'AI Assistant', 'Mobile App', 'Pricing', 'Enterprise'],
    'Support': ['Help Center', 'Contact Us', 'Live Chat', 'Documentation', 'Status'],
    'Company': ['About Us', 'Careers', 'Press', 'Partners', 'Blog'],
    'Legal': ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Licenses']
  };

  const socialLinks = [
    { icon: 'ri-facebook-fill', href: '#', label: 'Facebook' },
    { icon: 'ri-twitter-fill', href: '#', label: 'Twitter' },
    { icon: 'ri-instagram-line', href: '#', label: 'Instagram' },
    { icon: 'ri-linkedin-fill', href: '#', label: 'LinkedIn' },
    { icon: 'ri-youtube-fill', href: '#', label: 'YouTube' }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Pacifico, serif' }}>
              Tripy
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your AI-powered travel companion that makes every journey seamless, memorable, and perfectly planned.
            </p>
            
            <div className="flex items-center gap-4 mb-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 bg-violet-600 hover:bg-violet-700 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className={`${social.icon} text-lg`}></i>
                </a>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 bg-black rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors cursor-pointer">
                <i className="ri-google-play-fill text-2xl"></i>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Get it on</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </button>
              <button className="flex items-center gap-2 bg-black rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors cursor-pointer">
                <i className="ri-apple-fill text-2xl"></i>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </button>
            </div>
          </div>
          
          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-lg mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-white transition-colors text-sm cursor-pointer"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <p className="text-gray-400 text-sm">
                © 2024 Tripy. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-400">All systems operational</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <i className="ri-shield-check-line"></i>
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <i className="ri-award-line"></i>
                <span>ISO 27001 Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
