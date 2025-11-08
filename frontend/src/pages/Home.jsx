import React from "react";
import heroImage from "@/assets/bgmain.png";
import car1 from "@/assets/car/aura-front.jpeg";
import car2 from "@/assets/car/ceta-front.jpeg";
import car3 from "@/assets/car/harrier-front.jpeg";
import car4 from "@/assets/car/xuv-front.jpeg";
import { ArrowRight, Award, Shield, Users, Clock } from "lucide-react";

const Home = () => {
  const stats = [
    { number: "90+", label: "Years of Experience", icon: Clock },
    { number: "1000+", label: "Happy Clients", icon: Users },
    { number: "2000+", label: "Cars Sold", icon: Award },
    { number: "24/7", label: "Support", icon: Shield },
  ];

  const features = [
    {
      icon: "🔍",
      title: "Know the true value",
      desc: "We ensure every car is inspected and priced fairly to give you the best deal.",
    },
    {
      icon: "🚗",
      title: "Legacy like no other",
      desc: "With decades of experience, we've built trust and relationships with thousands of customers.",
    },
    {
      icon: "🤝",
      title: "Friend first, dealer next",
      desc: "Our service is focused on your satisfaction, ensuring a smooth and happy experience.",
    },
  ];

  const cars = [
    {
      img: car1,
      name: "Honda Jazz V 1.2",
      year: "2016",
      price: "₹ 5,30,000",
      km: "18000",
      type: "CVT",
      owner: "2nd",
      fuel: "Petrol",
    },
    {
      img: car2,
      name: "Hyundai Grand i10 Nios Asta 1.2",
      year: "2022",
      price: "₹ 7,50,000",
      km: "24000",
      type: "AMT",
      owner: "1st",
      fuel: "Petrol",
    },
    {
      img: car3,
      name: "Hyundai Venue Turbo GDI SX Plus 1.0",
      year: "2023",
      price: "₹ 11,80,000",
      km: "15000",
      type: "DCT",
      owner: "1st",
      fuel: "Petrol",
    },
    {
      img: car4,
      name: "Maruti Baleno Alpha 1.2",
      year: "2021",
      price: "₹ 8,40,000",
      km: "22000",
      type: "Manual",
      owner: "1st",
      fuel: "Petrol",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />

        <div className="relative z-10 container mx-auto px-6 lg:px-12">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Explore the Road Ahead with{" "}
              <span className="text-green-400">Premium Auto</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
              90 years of legacy, thousands of happy customers & the same old
              trust.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/cars"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all"
              >
                View All Cars <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="/contact"
                className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-all"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {stats.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="text-center hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 text-green-600">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-4xl font-bold text-green-600 mb-1">
                    {item.number}
                  </h3>
                  <p className="font-medium text-gray-700">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why <span className="text-green-600">Premium Auto</span>?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Experience excellence in automotive service with decades of
              trusted expertise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {features.map((card, i) => (
              <div
                key={i}
                className="bg-gray-50 border border-gray-200 hover:border-green-400 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-500"
              >
                <div className="text-6xl mb-6">{card.icon}</div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">
                  {card.title}
                </h3>
                <p className="text-gray-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-2 border-l-4 border-green-500 pl-4">
                Featured Cars
              </h2>
              <p className="text-gray-600 pl-4">
                Handpicked premium vehicles for you
              </p>
            </div>
            <a
              href="/cars"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all"
            >
              Show All <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {cars.map((car, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500"
              >
                <div className="relative">
                  <img
                    src={car.img}
                    alt={car.name}
                    className="w-full h-56 object-cover hover:scale-110 transition-transform duration-700"
                  />
                  <span className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                    {car.year}
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2">{car.name}</h3>
                  <p className="text-2xl font-bold text-green-600 mb-4">
                    {car.price}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                    <span>{car.km} km</span>
                    <span>{car.type}</span>
                    <span>{car.owner} Owner</span>
                    <span>{car.fuel}</span>
                  </div>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all">
                    See Full Details <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
