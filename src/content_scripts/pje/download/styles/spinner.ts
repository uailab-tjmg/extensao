const style = document.createElement("style");
style.textContent = `
    .spinner {
      display: inline-block;
      position: relative;
      width: 80px;
      height: 40px;
    }
  
    .spinner > div {
      background-color: #007bff;
      height: 100%;
      width: 6px;
      display: inline-block;
      animation: sk-bouncedelay 1.4s infinite ease-in-out both;
    }
  
    .spinner .bounce1 {
      animation-delay: -0.32s;
    }
  
    .spinner .bounce2 {
      animation-delay: -0.16s;
    }
  
    @keyframes sk-bouncedelay {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }
`;
document.head.appendChild(style);