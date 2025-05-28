import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 8;

  const nextSlide = () => {
    setCurrentSlide(current => current === totalSlides ? 1 : current + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(current => current === 1 ? totalSlides : current - 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Minimal Header */}
      <div className="w-full px-6 py-4 flex justify-between items-center border-b border-gray-200">
        <div className="text-xl font-medium">FORZA</div>
        <nav className="hidden md:flex space-x-6 text-sm">
          <a href="/manifesto" className="hover:text-gray-600">MANIFESTO</a>
          <span>/</span>
          <a href="/proyecto" className="hover:text-gray-600">PROYECTO</a>
          <span>/</span>
          <a href="/nosotros" className="hover:text-gray-600">NOSOTROS</a>
          <span>/</span>
          <a href="/contacto" className="hover:text-gray-600">CONTACTO</a>
        </nav>
        <button 
          onClick={() => navigate('/login')} 
          className="text-sm hover:text-gray-600"
        >
          COMENZAR
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Content */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-between">
          <div>
            <h1 className="text-[8rem] leading-none font-bold tracking-tighter mb-16">
              FORZA
            </h1>
            <div className="space-y-8">
              <p className="text-xl">
                Lorem ipsum dolor sit amet consectetur. Habitant tortor natoque ut ultricies magna sed volutpat. Lacus imperdiet enim massa imperdiet habitant
              </p>
              <p className="text-xl">
                Ullamcorper at laoreet in viverra adipiscing pellentesque maecenas. Integer suspendisse cras rhoncus enim nunc.
              </p>
            </div>
          </div>
          
          {/* Slide Counter */}
          <div className="mt-8 flex items-center space-x-4">
            <span className="text-sm">
              {String(currentSlide).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={prevSlide}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ←
              </button>
              <button 
                onClick={nextSlide}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="w-full md:w-1/2 bg-gray-100">
          <img
            src="https://images.pexels.com/photos/137586/pexels-photo-137586.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Architectural detail"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;