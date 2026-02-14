import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Shirt, 
  Sparkles, 
  Droplets,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Package,
  Loader2
} from 'lucide-react';
import { useServiceCategories } from '../hooks/useServiceCategories';

type ServiceDetail = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  longDescription: string;
  features: string[];
  priceRange: string;
  turnaround: string;
  image: string;
};

const services: ServiceDetail[] = [
  {
    id: 'laundry',
    name: 'Laundry Services',
    icon: Droplets,
    color: 'bg-[#e14171]',
    description: 'Complete wash, dry & fold service',
    longDescription: 'Our comprehensive laundry service handles all your everyday clothing with expert care. We sort, wash, dry, and fold your items to perfection. Choose from multiple detergent options and customize your folding preferences.',
    features: [
      'Sorted by color and fabric type',
      'Choice of detergent (standard, eco, hypoallergenic)',
      'Multiple folding styles available',
      'Fabric softener optional',
      'Stain pre-treatment included',
      'Ironing service available'
    ],
    priceRange: '$2.50/kg or $12/bag',
    turnaround: '24 hours',
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&h=400&fit=crop'
  },
  {
    id: 'suit-cleaning',
    name: 'Suit Cleaning',
    icon: Shirt,
    color: 'bg-black',
    description: 'Professional suit care & pressing',
    longDescription: 'Trust your finest suits to our expert cleaning team. We use specialized techniques to clean, press, and restore your suits to their showroom condition. Perfect for business professionals who demand the best.',
    features: [
      'Specialized suit cleaning solvents',
      'Expert pressing and finishing',
      'Button and seam inspection',
      'Protective garment bags included',
      'Minor repairs at no extra cost',
      'Same-day service available'
    ],
    priceRange: '$18-$30 per suit',
    turnaround: '48 hours',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=400&fit=crop'
  },
  {
    id: 'shoe-cleaning',
    name: 'Shoe Cleaning',
    icon: Sparkles,
    color: 'bg-[#e14171]',
    description: 'Restore your footwear to like-new',
    longDescription: 'Our shoe cleaning experts can restore any type of footwear - from everyday sneakers to premium leather shoes. We use specialized products and techniques for each material type to ensure the best results.',
    features: [
      'Deep cleaning for all shoe types',
      'Leather conditioning and polishing',
      'Suede and nubuck restoration',
      'Sole cleaning and whitening',
      'Deodorizing treatment',
      'Color restoration available'
    ],
    priceRange: '$15-$35 per pair',
    turnaround: '48-72 hours',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop'
  },
  {
    id: 'dry-cleaning',
    name: 'Dry Cleaning',
    icon: Package,
    color: 'bg-black',
    description: 'Delicate fabric specialists',
    longDescription: 'Our dry cleaning service is perfect for delicate fabrics that require special care. From silk blouses to cashmere sweaters, we handle your finest garments with the expertise they deserve.',
    features: [
      'Eco-friendly dry cleaning solvents',
      'Expert stain removal',
      'Hand finishing available',
      'Protective garment bags',
      'Beading and sequin safe',
      'Wedding dress specialists'
    ],
    priceRange: '$5-$150 per item',
    turnaround: '48-72 hours',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=400&fit=crop'
  }
];

function ServiceCard({ service }: { service: ServiceDetail }) {
  return (
    <Link 
      to={`/services/${service.id}`}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group"
    >
      <div className="h-48 overflow-hidden">
        <img 
          src={service.image} 
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`${service.color} p-2 rounded-lg text-white`}>
            <service.icon className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
        </div>
        <p className="text-gray-600 mb-4">{service.description}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#e14171] font-medium">{service.priceRange}</span>
          <span className="flex items-center gap-1 text-gray-500">
            Learn more <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ServiceDetailPage({ service }: { service: ServiceDetail }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link 
          to="/services"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#e14171]"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Services
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className={`inline-flex items-center gap-2 ${service.color} text-white px-4 py-2 rounded-full mb-6`}>
              <service.icon className="h-5 w-5" />
              <span className="font-medium">{service.name}</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{service.name}</h1>
            <p className="text-xl text-gray-600 mb-8">{service.longDescription}</p>
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="bg-white rounded-xl px-6 py-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Price Range</div>
                <div className="text-xl font-bold text-[#e14171]">{service.priceRange}</div>
              </div>
              <div className="bg-white rounded-xl px-6 py-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Turnaround</div>
                <div className="text-xl font-bold text-gray-900">{service.turnaround}</div>
              </div>
            </div>
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 bg-[#e14171] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#c73562] transition-colors"
            >
              Book This Service
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img 
              src={service.image} 
              alt={service.name}
              className="w-full h-80 lg:h-96 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">What's Included</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {service.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Schedule your pickup today and experience our premium {service.name.toLowerCase()} service.
          </p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 bg-[#e14171] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#c73562] transition-colors"
          >
            Schedule Pickup
          </Link>
        </div>
      </section>
    </div>
  );
}

export function Services() {
  const { serviceId } = useParams();
  const { categories, loading } = useServiceCategories();
  const [mergedServices, setMergedServices] = useState<ServiceDetail[]>(services);

  // Merge database categories with hardcoded services data (for images and icons)
  useEffect(() => {
    if (categories.length > 0) {
      const merged = services.map(service => {
        // Map service id to category slug
        const slugMap: Record<string, string> = {
          'laundry': 'laundry',
          'suit-cleaning': 'suit',
          'shoe-cleaning': 'shoe',
          'dry-cleaning': 'dry-clean'
        };
        
        const categorySlug = slugMap[service.id];
        const dbCategory = categories.find(c => c.slug === categorySlug);
        
        if (dbCategory) {
          return {
            ...service,
            name: dbCategory.name,
            description: dbCategory.tagline || service.description,
            longDescription: dbCategory.description || service.longDescription,
            priceRange: dbCategory.price_range,
            features: dbCategory.features.length > 0 ? dbCategory.features : service.features
          };
        }
        return service;
      });
      setMergedServices(merged);
    }
  }, [categories]);

  if (serviceId) {
    const service = mergedServices.find(s => s.id === serviceId);
    if (service) {
      return <ServiceDetailPage service={service} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <section className="bg-gradient-to-r from-black to-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            From everyday laundry to specialized suit and shoe cleaning, we handle it all with expert care.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {mergedServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Special Requests */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Something Special?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Have an unusual item or special request? Contact us and we'll create a custom solution for you.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Designer Items', desc: 'Expert care for luxury brands' },
              { title: 'Vintage Restoration', desc: 'Careful restoration of antique pieces' },
              { title: 'Bulk Orders', desc: 'Corporate and hotel services' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-6 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
