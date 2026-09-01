import React from "react";

const LocationMap = () => {
  return (
    <>
      <div className="location-map">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3558.026136195726!2d80.9392233!3d26.9034237!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3999564d3999557b%3A0xcb13e9a4f4e24217!2sInstitute%20of%20Engineering%20and%20Technology%20(IET)%2C%20Lucknow!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
          width={"100%"}
          height={400}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </>
  );
};

export default LocationMap;