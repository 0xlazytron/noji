import React, { useContext, useEffect, useRef } from "react";
import { HomeContext } from "../../context/context";
//import { Link } from "react-router-dom";
import audio from "../../files/Noji.mpeg";
import "./footer.css";

export const Footer = () => {
  const { play, setPlay } = useContext(HomeContext);

  return (
    <section className="centerFooter">
      <div className="footer">
        <Bars play={play} setPlay={setPlay} />
        <p className="first">© 2022 Noji By Addie.</p>
        <p className="last">© 2022 Noji By Addie.</p>
      </div>
    </section>
  );
};

const Bars = ({ play, setPlay }) => {
  const audioPlayer = useRef();

  useEffect(() => {
    if (play) {
      audioPlayer.current.play();
    } else {
      audioPlayer.current.pause();
    }
  }, [play]);

  return (
    <div>
      <audio controls autoPlay loop className="audio-player" ref={audioPlayer}>
        <source src={audio} type="audio/mpeg" />
      </audio>
      <section className="bars" onClick={() => setPlay(!play)}>
        <span
          className={play ? `first-bar` : ""}
          style={{ animationDuration: `${Math.random() + 0.4}s` }}
        ></span>
        <span
          className={play ? `second-bar` : ""}
          style={{ animationDuration: `${Math.random() + 0.4}s` }}
        ></span>
        <span
          className={play ? `third-bar` : ""}
          style={{ animationDuration: `${Math.random() + 0.4}s` }}
        ></span>
      </section>
    </div>
  );
};
