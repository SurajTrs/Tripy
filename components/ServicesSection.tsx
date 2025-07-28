
'use client';

interface ServicesSectionProps {
  onActivateAssistant?: () => void;
}

export default function ServicesSection({ onActivateAssistant }: ServicesSectionProps) {
  const services = [
    {
      title: 'Pre-Trip Planning',
      description: 'Complete trip planning with destination research, visa requirements, and travel documentation.',
      image: 'https://readdy.ai/api/search-image?query=modern%20travel%20planning%20interface%20showing%20world%20map%20with%20destinations%20flight%20routes%20hotel%20bookings%20and%20itinerary%20planning%20in%20violet%20purple%20theme%20with%20AI%20assistant%20elements%20and%20travel%20documents&width=400&height=300&seq=pre-trip&orientation=landscape',
      features: ['Destination Research', 'Visa & Documentation', 'Budget Planning', 'Custom Itineraries']
    },
    {
      title: 'During Your Journey',
      description: 'Real-time assistance throughout your trip with live tracking and instant support.',
      image: 'https://readdy.ai/api/search-image?query=traveler%20using%20smartphone%20with%20AI%20travel%20assistant%20app%20showing%20real-time%20navigation%20local%20recommendations%20weather%20updates%20and%20live%20location%20sharing%20in%20modern%20violet%20interface%20design&width=400&height=300&seq=during-trip&orientation=landscape',
      features: ['Live Navigation', 'Real-time Updates', 'Emergency Support', 'Local Recommendations']
    },
    {
      title: 'Post-Trip Support',
      description: 'Trip memories, feedback collection, and planning for your next adventure.',
      image: 'https://readdy.ai/api/search-image?query=travel%20memories%20interface%20showing%20photo%20galleries%20trip%20highlights%20review%20system%20and%20next%20trip%20recommendations%20in%20elegant%20violet%20design%20with%20AI-powered%20insights%20and%20travel%20analytics&width=400&height=300&seq=post-trip&orientation=landscape',
      features: ['Trip Memories', 'Feedback & Reviews', 'Travel Analytics', 'Future Recommendations']
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Complete Travel Support
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From planning to memories, Tripy accompanies you through every step of your journey with intelligent assistance.
          </p>
        </div>
        
        <div className="space-y-24">
          {services.map((service, index) => (
            <div key={index} className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
              <div className={`${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  {service.title}
                </h3>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  {service.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
                        <i className="ri-check-line text-white text-sm"></i>
                      </div>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8">
                  <button 
                    onClick={onActivateAssistant}
                    className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 cursor-pointer whitespace-nowrap"
                  >
                    Learn More
                  </button>
                </div>
              </div>
              
              <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-all duration-300"></div>
                  <img
                    src={service.image}
                    alt={service.title}
                    className="relative w-full h-80 object-cover rounded-2xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-3xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h3>
            <p className="text-xl text-violet-100 mb-8">Join thousands of travelers who trust Tripy for their adventures.</p>
            <button 
              onClick={onActivateAssistant}
              className="px-8 py-4 bg-white text-violet-600 font-semibold rounded-full hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
