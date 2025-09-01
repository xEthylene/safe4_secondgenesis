
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  onFinished?: () => void;
  onProceed?: () => void;
  className?: string;
}

const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 30, onFinished, onProceed, className }) => {
  const [displayedText, setDisplayedText] = useState('');
  const intervalRef = useRef<number | null>(null);
  const isTypingRef = useRef(true);
  
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  const completeTyping = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isTypingRef.current) {
        setDisplayedText(text);
        isTypingRef.current = false;
        if (onFinishedRef.current) {
            onFinishedRef.current();
        }
    }
  }, [text]);

  useEffect(() => {
    setDisplayedText('');
    isTypingRef.current = true;
    
    if (text.length === 0) {
      completeTyping();
      return;
    }

    let i = 0;
    intervalRef.current = window.setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        completeTyping();
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, completeTyping]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTypingRef.current) {
      completeTyping();
    } else if (onProceed) {
      onProceed();
    }
  };
  
  const displayTextWithBreaks = displayedText.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ));

  return <div className={className} onClick={handleClick}>{displayTextWithBreaks}</div>;
};

export default Typewriter;