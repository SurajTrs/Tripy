
'use client';

export default function FeaturesSection() {
  const features = [
    {
      icon: 'ri-search-line',
      title: 'Smart Search & Compare',
      description: 'AI-powered search across all travel modes - flights, trains, buses, and cabs with real-time price comparison.',
      color: 'from-violet-500 to-purple-500'
    },
    {
      icon: 'ri-hotel-line',
      title: 'Hotel & Accommodation',
      description: 'Find and book the best-rated hotels with personalized recommendations based on your preferences.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: 'ri-restaurant-line',
      title: 'Local Food & Dining',
      description: 'Discover authentic local cuisine and make restaurant reservations with real-time availability.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: 'ri-map-pin-line',
      title: 'Personalized Itineraries',
      description: 'AI-generated travel itineraries tailored to your interests, time, and budget constraints.',
      color: 'from-rose-500 to-orange-500'
    },
    {
      icon: 'ri-bank-card-line',
      title: 'Secure Payment Integration',
      description: 'Safe and secure payment processing with multiple payment options and instant booking confirmation.',
      color: 'from-orange-500 to-yellow-500'
    },
    {
      icon: 'ri-global-line',
      title: 'Multilingual Support',
      description: '25+ languages with real-time voice translation and cultural context for global travelers.',
      color: 'from-yellow-500 to-green-500'
    },
    {
      icon: 'ri-cloud-line',
      title: 'Weather & Currency',
      description: 'Real-time weather updates and currency exchange rates with travel alerts and recommendations.',
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Travel Insurance & Safety',
      description: 'Comprehensive travel insurance options with emergency contacts and live location sharing.',
      color: 'from-teal-500 to-blue-500'
    },
    {
      icon: 'ri-mic-line',
      title: 'Voice Command Control',
      description: 'Complete hands-free travel management with natural language voice commands and responses.',
      color: 'from-blue-500 to-indigo-500'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Powerful AI Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of travel with our advanced AI-powered features designed to make your journey seamless and memorable.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-violet-200">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <i className={`${feature.icon} text-2xl text-white`}></i>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-violet-600 transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
              
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full">
            <i className="ri-sparkle-line text-violet-600"></i>
            <span className="text-violet-800 font-medium">All features powered by advanced AI technology</span>
          </div>
        </div>
      </div>
    </section>
  );
}
