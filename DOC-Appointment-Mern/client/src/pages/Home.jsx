import React from "react";
import Slider from "../components/slider/Slider";
import Facility from "../components/static/Facility/Facility";
import ShortIntro from "../components/static/ShortIntro/ShortIntro";
import WhyChoose from "../components/static/WhyChoose/WhyChoose";
import PatientReviews from "../components/static/PatientReviews/PatientReviews";
import ContactMessage from "../components/static/ContactMessage/ContactMessage";

const Home = () => {
  return (
    <>
      {/* slider wapas aa gaya */}
      <Slider />
      
      {/* facility */}
      <Facility />
      
      {/* short hospital intro */}
      <ShortIntro />
      
      {/* why choose page */}
      <WhyChoose />
      
      {/* testimonial */}
      <PatientReviews />
      
      {/* contact */}
      <ContactMessage />
    </>
  );
};

export default Home;