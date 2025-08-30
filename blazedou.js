(function() { 
    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css";
    document.head.appendChild(link);
  
    let container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "50%";
    container.style.left = "50%";
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
    video.src = "https://sistemadomines.netlify.app/assets/3585079191-preview.mp4_1728018529513-_uhUTxz9_1.mp4";
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
    buttonsContainer.style.gap = "10px";
    document.body.appendChild(buttonsContainer);
  
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
  
    createButton("Hackear Double", "fa-play", function() {
      let oldBox = document.getElementById("result-box");
      if (oldBox) oldBox.remove();
  
      const values = [1, 2, 3, 5, 7, 8, 9, 11, 12, 13, 14, 0];
      let randomValue = values[Math.floor(Math.random() * values.length)];
  
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
      loadingText.innerHTML = "HACKEANDO PLATAFORMA...";
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
      loadingBarContainer.style.zIndex = "10000";
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
            loadingOverlay.style.display = "none";
  
            let assertiveness = document.createElement("div");
            let randomAssertiveness = (Math.random() * (100 - 90) + 90).toFixed(2);
            assertiveness.innerHTML = `ASSERTIVIDADE DE ${randomAssertiveness}%`;
            assertiveness.style.color = "green";
            assertiveness.style.fontSize = "16px";
            assertiveness.style.fontWeight = "bold";
            assertiveness.style.marginTop = "10px";
            assertiveness.style.textAlign = "center";
            assertiveness.style.zIndex = "2";
            assertiveness.style.position = "relative";
            assertiveness.style.top = "0%";
  
            let box = document.createElement("div");
            box.id = "result-box";
            box.style.width = "77px";
            box.style.height = "77px";
            box.style.display = "flex";
            box.style.alignItems = "center";
            box.style.justifyContent = "center";
            box.style.borderRadius = "5px";
            box.style.position = "relative";
            box.style.zIndex = "3";
            box.style.top = "0%";
  
            let circle = document.createElement("div");
            circle.style.width = "42px";
            circle.style.height = "42px";
            circle.style.display = "flex";
            circle.style.alignItems = "center";
            circle.style.justifyContent = "center";
            circle.style.borderRadius = "50%";
            circle.style.border = "3px solid white";
            circle.style.fontSize = "18px";
            circle.style.fontWeight = "800";
            circle.style.textAlign = "center";
            circle.style.color = "white";
            circle.textContent = randomValue;
  
            if ([1, 2, 3, 5, 7].includes(randomValue)) {
                box.style.backgroundColor = "rgb(255, 72, 72)";
                circle.style.color = "white";
                circle.style.border = "4px solid white";
            } else if ([8, 9, 11, 12, 13, 14].includes(randomValue)) {
                box.style.backgroundColor = "#424242"; 
               
                circle.style.color = "white";
                circle.style.border = "4px solid white";
            } else {
                box.style.backgroundColor = "white"; 
                circle.style.color = "black";
                circle.style.border = "4px solid black";
            }
            
  
            box.appendChild(circle);
            container.appendChild(box);
            container.appendChild(assertiveness);
  
            setTimeout(() => {
                box.style.display = "none";
                assertiveness.style.display = "none";
            }, 8000);
        }, 5000);
    });

    
    let socialContainer = document.createElement("div");
    socialContainer.style.position = "absolute";
    socialContainer.style.bottom = "10px";
    socialContainer.style.display = "flex";
    socialContainer.style.gap = "15px";
    socialContainer.style.justifyContent = "center";
    socialContainer.style.alignItems = "center";
    socialContainer.style.width = "100%";
    socialContainer.style.zIndex = "3";

   
    let instagramLink = document.createElement("a");
    instagramLink.href = "https://www.instagram.com/marquesz.00/?hl=pt-br";
    instagramLink.target = "_blank";
    instagramLink.innerHTML = `<i class="fab fa-instagram"></i>`;
    instagramLink.style.color = "#E1306C";
    instagramLink.style.fontSize = "22px";
    instagramLink.style.transition = "transform 0.3s";
    instagramLink.addEventListener("mouseover", () => {
        instagramLink.style.transform = "scale(1.3)";
    });
    instagramLink.addEventListener("mouseout", () => {
        instagramLink.style.transform = "scale(1)";
    });
    socialContainer.appendChild(instagramLink);

  
    let telegramLink = document.createElement("a");
    telegramLink.href = "https://t.me/+sgo_UhmzljA0MzBh";
    telegramLink.target = "_blank";
    telegramLink.innerHTML = `<i class="fab fa-telegram-plane"></i>`;
    telegramLink.style.color = "#0088cc";
    telegramLink.style.fontSize = "22px";
    telegramLink.style.transition = "transform 0.3s";
    telegramLink.addEventListener("mouseover", () => {
        telegramLink.style.transform = "scale(1.3)";
    });
    telegramLink.addEventListener("mouseout", () => {
        telegramLink.style.transform = "scale(1)";
    });
    socialContainer.appendChild(telegramLink);
    let whatsappLink = document.createElement("a");
    whatsappLink.href = "https://wa.me/message/YYPLALEKW7IZK1";
    whatsappLink.target = "_blank";
    whatsappLink.innerHTML = `<i class="fab fa-whatsapp"></i>`;
    whatsappLink.style.color = "#25D366";
    whatsappLink.style.fontSize = "22px";
    whatsappLink.style.transition = "transform 0.3s";
    whatsappLink.addEventListener("mouseover", () => {
        whatsappLink.style.transform = "scale(1.3)";
    });
    whatsappLink.addEventListener("mouseout", () => {
        whatsappLink.style.transform = "scale(1)";
    });
    socialContainer.appendChild(whatsappLink);

    container.appendChild(socialContainer);
})();
