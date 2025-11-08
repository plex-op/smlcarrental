import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you for your message! We will get back to you soon.");
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Us",
      details: ["123 Car Street", "Auto City, AC 12345"],
    },
    {
      icon: Phone,
      title: "Call Us",
      details: ["+1 (555) 123-4567", "+1 (555) 987-6543"],
    },
    {
      icon: Mail,
      title: "Email Us",
      details: ["info@premiumauto.com", "support@premiumauto.com"],
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: ["Monday - Sunday", "9:00 AM - 8:00 PM"],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative bg-gradient-to-r from-green-50 via-white to-green-50 py-20">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get In <span className="text-green-600">Touch</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions? We're here to help. Reach out to us and we'll
            respond as soon as possible.
          </p>
        </div>
      </section>

      {/* CONTACT FORM & INFO */}
      <div className="container mx-auto px-6 lg:px-12 py-20">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* FORM */}
          <div className="bg-gray-50 border border-gray-200 p-8 md:p-10 rounded-2xl shadow-sm">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Send Us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                  placeholder="Tell us how we can help you..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                Send Message <Send className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* CONTACT DETAILS */}
          <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              Contact Information
            </h2>

            <div className="space-y-6 mb-10">
              {contactInfo.map((info, i) => {
                const Icon = info.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-md transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {info.title}
                      </h3>
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-gray-600">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gray-100 h-80 rounded-2xl flex items-center justify-center border border-gray-200">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  Interactive Map Would Be Here
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <section className="mt-20 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-3xl p-12 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Perfect Car?
          </h2>
          <p className="text-lg mb-8 text-green-100 max-w-2xl mx-auto">
            Visit our showroom today and let our experienced team help you
            discover the vehicle that's right for you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/cars"
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Browse Cars
            </a>
            <a
              href="tel:+15551234567"
              className="bg-green-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-900 transition-all transform hover:scale-105"
            >
              Call Now
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;
