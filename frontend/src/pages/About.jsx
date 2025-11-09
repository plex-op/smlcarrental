import { Award, Shield, Users, CheckCircle, Heart } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Trust & Integrity",
      desc: "Built on 15+ Years of honest dealings and transparent practices.",
    },
    {
      icon: Heart,
      title: "Customer First",
      desc: "Your satisfaction is our priority, treating you as family.",
    },
    {
      icon: Award,
      title: "Quality Assured",
      desc: "Every vehicle undergoes rigorous inspection and certification.",
    },
    {
      icon: Users,
      title: "Expert Team",
      desc: "Knowledgeable professionals dedicated to serving you.",
    },
  ];

  const milestones = [
    { year: "1934", event: "SML Cars Founded" },
    { year: "1970", event: "Expanded to 5 Locations" },
    { year: "1995", event: "Introduced Quality Certification" },
    { year: "2010", event: "Reached 1000+ Happy Customers" },
    { year: "2024", event: "Celebrating 15+ Years of Excellence" },
  ];

  const achievements = [
    "Over 2000 cars sold",
    "1000+ satisfied customers",
    "15+ Years of legacy",
    "100% quality certified vehicles",
    "24/7 customer support",
    "Industry-leading warranty programs",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-r from-green-50 via-white to-green-50 py-20">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About <span className="text-green-600">SML Cars</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            A legacy of trust, excellence, and commitment to automotive
            excellence spanning nine decades
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 lg:px-12 py-20">
        {/* STORY SECTION */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              Our Story
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Welcome to SML Cars, your trusted partner in finding the
                perfect vehicle. Since 1934, we've been serving our community
                with dedication, integrity, and an unwavering commitment to
                quality.
              </p>
              <p>
                What started as a small family business has grown into one of
                the region's most respected automotive dealerships. Through the
                decades, we've helped thousands of families find their ideal
                vehicles, always putting their needs first.
              </p>
              <p>
                Our mission is to make car buying and selling simple,
                transparent, and enjoyable. We believe everyone deserves access
                to quality vehicles at fair prices, backed by service that goes
                beyond the sale.
              </p>
              <p>
                Today, with 15+ Years of experience behind us, we continue to
                uphold the same values that our founders established: honesty,
                quality, and customer satisfaction above all else.
              </p>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Our showroom"
              className="rounded-2xl shadow-xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-green-600 text-white p-6 rounded-xl shadow-lg">
              <p className="text-4xl font-bold">15+</p>
              <p className="text-sm">Years of Excellence</p>
            </div>
          </div>
        </div>

        {/* CORE VALUES */}
        <section className="py-16 bg-gray-50 rounded-3xl mb-20">
          <div className="container mx-auto px-6 lg:px-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-gray-900">
              Our Core Values
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, i) => {
                const Icon = value.icon;
                return (
                  <div
                    key={i}
                    className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-green-400 hover:shadow-lg hover:-translate-y-2 transition-all duration-500"
                  >
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="font-bold text-xl mb-3 text-gray-900">
                      {value.title}
                    </h3>
                    <p className="text-gray-600">{value.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-900">
            Our Journey Through Time
          </h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-green-200"></div>
            <div className="space-y-12">
              {milestones.map((milestone, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-8 ${
                    i % 2 === 0 ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  <div
                    className={`flex-1 ${
                      i % 2 === 0 ? "text-right" : "text-left"
                    }`}
                  >
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow inline-block">
                      <p className="text-3xl font-bold text-green-600 mb-2">
                        {milestone.year}
                      </p>
                      <p className="text-gray-700 font-medium">
                        {milestone.event}
                      </p>
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-green-600 rounded-full border-4 border-white shadow-lg z-10"></div>
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ACHIEVEMENTS */}
        <section className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-3xl p-12 md:p-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Our Achievements
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {achievements.map((achievement, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                  <p className="text-lg">{achievement}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-xl mb-6">
                Ready to experience the SML Cars difference?
              </p>
              <a
                href="/contact"
                className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                Get In Touch
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
