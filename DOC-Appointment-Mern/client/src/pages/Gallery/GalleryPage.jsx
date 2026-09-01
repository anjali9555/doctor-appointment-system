import React, { useState } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import { Lightbox } from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { photos } from "./GalleryData";

const GalleryPage = () => {
  const [index, setIndex] = useState(-1);

  return (
    <div style={{ paddingBottom: "40px" }}> 
      <h1 className="text-center m-5" style={{ fontSize: "2.5rem", fontWeight: "bold" }}>Gallery</h1>
      
      <RowsPhotoAlbum
        photos={photos}
        targetRowHeight={280} // Thodi height badha di taaki full width me aur achhi lage
        onClick={({ index: current }) => setIndex(current)}
      />
      
      <Lightbox
        index={index}
        slides={photos}
        open={index >= 0}
        close={() => setIndex(-1)}
      />
    </div>
  );
};

export default GalleryPage;