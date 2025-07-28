
'use client';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Adventure Traveler',
      location: 'New York, USA',
      content: 'Tripy made my solo trip to Japan absolutely seamless! The AI assistant booked everything perfectly and even helped me navigate Tokyo using voice commands. The multilingual support was a game-changer.',
      rating: 5,
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20photo%20of%20young%20woman%20with%20brown%20hair%20smiling%20confidently%20wearing%20casual%20modern%20clothing%20against%20clean%20background&width=80&height=80&seq=sarah-avatar&orientation=squarish'
    },
    {
      name: 'Michael Chen',
      role: 'Business Executive',
      location: 'Singapore',
      content: 'As someone who travels frequently for work, Tripy has become my personal travel assistant. The real-time updates and booking management through voice commands save me hours of planning time.',
      rating: 5,
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20photo%20of%20asian%20businessman%20with%20short%20black%20hair%20wearing%20suit%20and%20tie%20smiling%20warmly%20against%20neutral%20background&width=80&height=80&seq=michael-avatar&orientation=squarish'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Travel Blogger',
      location: 'Barcelona, Spain',
      content: 'The personalized itineraries are incredible! Tripy understood my love for local cuisine and off-the-beaten-path experiences. It found hidden gems I would never have discovered on my own.',
      rating: 5,
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20photo%20of%20young%20latina%20woman%20with%20long%20dark%20hair%20wearing%20trendy%20casual%20outfit%20smiling%20brightly%20against%20modern%20background&width=80&height=80&seq=emily-avatar&orientation=squarish'
    },
    {
      name: 'David Kumar',
      role: 'Family Traveler',
      location: 'Mumbai, India',
      content: 'Planning a family vacation with kids is stressful, but Tripy made it effortless. The AI found family-friendly hotels, activities, and restaurants. Even helped with emergency contacts during our trip.',
      rating: 5,
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20photo%20of%20indian%20man%20with%20glasses%20wearing%20polo%20shirt%20smiling%20warmly%20with%20friendly%20expression%20against%20simple%20background&width=80&height=80&seq=david-avatar&orientation=squarish'
    },
    {
      name: 'Lisa Thompson',
      role: 'Digital Nomad',
      location: 'London, UK',
      content: 'The weather and currency updates are so helpful for my nomadic lifestyle. Tripy keeps track of all my bookings and even reminds me about visa requirements. It\'s like having a travel agent in my pocket.',
      rating: 5,
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20photo%20of%20young%20british%20woman%20with%20blonde%20hair%20wearing%20modern%20casual%20clothes%20smiling%20confidently%20against%20clean%20minimalist%20background&width=80&height=80&seq=lisa-avatar&orientation=squarish'
    },
    {
      name: 'Ahmed Hassan',
      role: 'Adventure Photographer',
      location: 'Dubai, UAE',
      content: 'Tripy\'s location sharing feature gave my family peace of mind during my solo photography expeditions. The AI even suggested the best times to visit locations based on lighting and weather conditions.',
      rating: 5,
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20photo%20of%20middle%20eastern%20man%20with%20beard%20wearing%20casual%20shirt%20smiling%20warmly%20with%20creative%20artistic%20expression%20against%20neutral%20background&width=80&height=80&seq=ahmed-avatar&orientation=squarish'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            What Travelers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of satisfied travelers who have transformed their journey experience with Tripy AI.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-violet-200 group">
              <div className="flex items-center mb-6">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
                <div>
                  <h3 className="font-bold text-gray-900">{testimonial.name}</h3>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm text-violet-600">{testimonial.location}</p>
                </div>
              </div>
              
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <i key={i} className="ri-star-fill text-yellow-400 text-lg"></i>
                ))}
              </div>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center text-sm text-gray-500">
                <i className="ri-check-double-line text-green-500 mr-2"></i>
                <span>Verified Traveler</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-8 inline-block">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-violet-600">4.9/5</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-violet-600">50K+</div>
                <div className="text-sm text-gray-600">Happy Travelers</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-violet-600">25</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
