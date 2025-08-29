(function () {
  let link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css";
  document.head.appendChild(link);

  let container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "75%";
  container.style.left = "43%";
  container.style.transform = "translate(-50%, -50%)";
  container.style.width = "200px";
  container.style.height = "250px";
  container.style.borderRadius = "10px";
  container.style.padding = "20px";
  container.style.boxShadow = "0 0 10px rgb(255, 0, 0)";
  container.style.overflow = "hidden";
  container.style.backgroundColor = "black";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.filter = "contrast(1.2) brightness(0.8)";
  document.body.appendChild(container);

  let video = document.createElement("video");
  video.src =
    "https://sistemadomines.netlify.app/assets/3585079191-preview.mp4_1728018529513-_uhUTxz9_1.mp4";
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.style.position = "absolute";
  video.style.top = "0";
  video.style.left = "0";
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.objectFit = "cover";
  container.appendChild(video);

  let title = document.createElement("div");
  title.innerHTML = `<span style="white-space: nowrap; display: flex; align-items: center; gap: 6px;">
    <i class="fas fa-user-secret"></i><span>Hacker do Marquez</span>
  </span>`;
  title.style.color = "white";
  title.style.fontSize = "14px";
  title.style.position = "absolute";
  title.style.top = "10px";
  title.style.left = "50%";
  title.style.transform = "translateX(-50%)";
  title.style.fontWeight = "bold";
  title.style.textAlign = "center";
  container.appendChild(title);

  let buttonsContainer = document.createElement("div");
  buttonsContainer.style.position = "fixed";
  buttonsContainer.style.top = "calc(25% + 220px)";
  buttonsContainer.style.left = "33%";
  buttonsContainer.style.transform = "translateX(-50%)";
  buttonsContainer.style.display = "flex";
  buttonsContainer.style.flexDirection = "column";
  buttonsContainer.style.gap = "10px";
  document.body.appendChild(buttonsContainer);

  const playAudio = () => {
    let audio = new Audio("https://www.myinstants.com/media/sounds/hacker.mp3");
    audio.play().catch(() => {});
  };

  function createButton(text, iconClass, onClick) {
    let button = document.createElement("button");
    button.innerHTML = `<i class="fas ${iconClass}"></i> ${text}`;
    button.style.width = "200px";
    button.style.height = "50px";
    button.style.border = "2px solid rgb(255, 0, 0)";
    button.style.borderRadius = "8px";
    button.style.color = "rgb(255, 0, 0)";
    button.style.fontSize = "16px";
    button.style.fontWeight = "bold";
    button.style.cursor = "pointer";
    button.style.background = "rgba(0, 0, 0, 0.8)";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.position = "relative";
    button.style.zIndex = "3";
    button.style.boxShadow = "rgba(255, 0, 0, 0.5) 0px 0px 10px";
    button.style.transition = "background-color 0.3s ease, transform 0.3s ease";

    button.addEventListener("mouseover", () => {
      button.style.transform = "scale(1.1)";
    });
    button.addEventListener("mouseout", () => {
      button.style.transform = "scale(1)";
    });
    if (onClick) button.addEventListener("click", onClick);
    buttonsContainer.appendChild(button);
  }

  function handleHack(nome) {
    playAudio();

    let loadingOverlay = document.createElement("div");
    loadingOverlay.style.position = "fixed";
    loadingOverlay.style.top = "0";
    loadingOverlay.style.left = "0";
    loadingOverlay.style.width = "100%";
    loadingOverlay.style.height = "100%";
    loadingOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.79)";
    loadingOverlay.style.zIndex = "9999";
    document.body.appendChild(loadingOverlay);

    let loadingText = document.createElement("div");
    loadingText.innerHTML = `HACKEANDO ${nome.toUpperCase()}...`;
    loadingText.style.color = "white";
    loadingText.style.fontSize = "20px";
    loadingText.style.fontWeight = "bold";
    loadingText.style.position = "absolute";
    loadingText.style.top = "47%";
    loadingText.style.left = "50%";
    loadingText.style.transform = "translate(-50%, -50%)";
    loadingOverlay.appendChild(loadingText);

    let loadingBarContainer = document.createElement("div");
    loadingBarContainer.style.width = "1100px";
    loadingBarContainer.style.height = "10px";
    loadingBarContainer.style.backgroundColor = "white";
    loadingBarContainer.style.position = "absolute";
    loadingBarContainer.style.top = "50%";
    loadingBarContainer.style.left = "13%";
    loadingOverlay.appendChild(loadingBarContainer);

    let loadingBar = document.createElement("div");
    loadingBar.style.height = "100%";
    loadingBar.style.width = "0";
    loadingBar.style.backgroundColor = "red";
    loadingBar.style.transition = "width 4s ease-in-out";
    loadingBarContainer.appendChild(loadingBar);

    setTimeout(() => {
      loadingBar.style.width = "100%";
    }, 100);

    setTimeout(() => {
      loadingOverlay.remove();

      if (nome === "Mines") {
        let gridContainer = document.createElement("div");
        gridContainer.style.display = "grid";
        gridContainer.style.gridTemplateColumns = "repeat(5, 104px)";
        gridContainer.style.gridTemplateRows = "repeat(5, 127px)";
        gridContainer.style.gridGap = "10px";
        gridContainer.style.width = "180px";
        gridContainer.style.marginTop = "20px";
        gridContainer.style.position = "fixed";
        gridContainer.style.top = "47%";
        gridContainer.style.left = "55%";
        gridContainer.style.transform = "translate(-45%, -50%)";
        gridContainer.style.pointerEvents = "none";

        gridContainer.style.zIndex = "10000";
        document.body.appendChild(gridContainer);

        for (let i = 0; i < 25; i++) {
          let cell = document.createElement("div");
          cell.style.width = "96px";
          cell.style.height = "101px";
          cell.style.display = "flex";
          cell.style.alignItems = "center";
          cell.style.justifyContent = "center";
          cell.style.borderRadius = "4px";
          cell.style.flexDirection = "column";
          cell.style.pointerEvents = "none";

          let highAssertivenessUsed = false;

          if (Math.random() < 0.25) {
            let diamond = document.createElement("img");
            diamond.src = "https://jon.bet/static/media/diamond.eac6e969.svg";
            diamond.style.width = "80px";
            diamond.style.height = "80px";
            diamond.style.position = "relative";
            diamond.style.pointerEvents = "none";
            diamond.style.top = "20px";
          
            let assertiveness = document.createElement("div");
            let randomAssertiveness;
          
            if (!highAssertivenessUsed && Math.random() < 0.1) {
              randomAssertiveness = (Math.random() * 10 + 90).toFixed(2);
              assertiveness.style.color = "#0f0";
              highAssertivenessUsed = true;
            } else {
              randomAssertiveness = (Math.random() * 10 + 50).toFixed(2); 
              assertiveness.style.color = "red";
            }
          
            assertiveness.textContent = `Assertividade: ${randomAssertiveness}%`;
            assertiveness.style.fontSize = "13px";
            assertiveness.style.marginTop = "6px";
            assertiveness.style.position = "relative";
            assertiveness.style.top = "25px";
            assertiveness.style.pointerEvents = "none";
          
            cell.appendChild(diamond);
            cell.appendChild(assertiveness);
          }

          gridContainer.appendChild(cell);
        }

        setTimeout(() => {
          gridContainer.remove();
        }, 8003);
      }
    }, 5000);
  }

  createButton("Hackear Mines", "fa-bug", () => handleHack("Mines"));

  let socialContainer = document.createElement("div");
  socialContainer.style.position = "absolute";
  socialContainer.style.bottom = "10px";
  socialContainer.style.display = "flex";
  socialContainer.style.gap = "15px";
  socialContainer.style.justifyContent = "center";
  socialContainer.style.alignItems = "center";
  socialContainer.style.width = "100%";
  socialContainer.style.zIndex = "3";

  const socials = [
    {
      href: "https://www.instagram.com/marquesz.00/?hl=pt-br",
      icon: "fab fa-instagram",
      color: "#E1306C",
    },
    {
      href: "https://t.me/+sgo_UhmzljA0MzBh",
      icon: "fab fa-telegram-plane",
      color: "#0088cc",
    },
    {
      href: "https://wa.me/message/YYPLALEKW7IZK1",
      icon: "fab fa-whatsapp",
      color: "#25D366",
    },
  ];

  socials.forEach((s) => {
    let a = document.createElement("a");
    a.href = s.href;
    a.target = "_blank";
    a.innerHTML = `<i class="${s.icon}"></i>`;
    a.style.color = s.color;
    a.style.fontSize = "22px";
    a.style.transition = "transform 0.3s";
    a.addEventListener("mouseover", () => {
      a.style.transform = "scale(1.3)";
    });
    a.addEventListener("mouseout", () => {
      a.style.transform = "scale(1)";
    });
    socialContainer.appendChild(a);
  });

  container.appendChild(socialContainer);
})();
