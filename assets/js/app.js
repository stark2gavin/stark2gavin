(function () {
  "use strict";

  const gate = document.querySelector("#gate");
  const openButton = document.querySelector("#open-letter");
  const experience = document.querySelector("#experience");
  const gateScene = window.RomanticScenes.createStarField(document.querySelector("#gate-canvas"));
  const heartScene = window.RomanticScenes.createHeartScene(document.querySelector("#heart-canvas"));
  const constellationScene = window.RomanticScenes.createStarField(
    document.querySelector("#constellation-canvas"),
    { maxStars: 230 }
  );
  const finaleScene = window.RomanticScenes.createFinale(document.querySelector("#finale-canvas"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let opened = false;
  let litStars = 0;

  function openExperience() {
    if (opened) {
      return;
    }

    opened = true;
    window.scrollTo(0, 0);
    gate.classList.add("is-opened");
    document.body.classList.remove("is-gated");
    document.body.classList.add("experience-open", "reveal-ready");
    experience.setAttribute("aria-hidden", "false");
    heartScene.start();
    updateVisibleReveals();

    window.setTimeout(() => gateScene.stop(), reducedMotion ? 0 : 900);
  }

  function updateVisibleReveals() {
    document.querySelectorAll("[data-reveal]").forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        element.classList.add("is-visible");
      }
    });
  }

  function setupRevealObserver() {
    const targets = document.querySelectorAll("[data-reveal]");

    if (!("IntersectionObserver" in window) || reducedMotion) {
      targets.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach((element) => observer.observe(element));
  }

  function setupChapterObserver() {
    const links = Array.from(document.querySelectorAll("[data-chapter]"));
    const sections = document.querySelectorAll("[data-chapter-section]");

    function setActive(chapter) {
      links.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.chapter === chapter);
      });
    }

    if (!("IntersectionObserver" in window)) {
      setActive("starlight");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActive(visible[0].target.dataset.chapterSection);
        }
      },
      { threshold: [0.28, 0.52, 0.72] }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function setupSceneObserver() {
    const hero = document.querySelector("#starlight");
    const constellation = document.querySelector("#constellation");
    const answer = document.querySelector("#answer");

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === hero) {
            if (entry.isIntersecting && opened) {
              heartScene.start();
            } else if (!entry.isIntersecting) {
              heartScene.stop();
            }
          }

          if (entry.target === constellation) {
            if (entry.isIntersecting) {
              constellationScene.start();
            } else {
              constellationScene.stop();
            }
          }

          if (entry.target === answer) {
            if (entry.isIntersecting) {
              finaleScene.start();
            } else {
              finaleScene.stop();
            }
          }
        });
      },
      { threshold: 0.08 }
    );

    observer.observe(hero);
    observer.observe(constellation);
    observer.observe(answer);
  }

  function setupConstellation() {
    const starButtons = document.querySelectorAll("[data-star]");
    const status = document.querySelector("#constellation-line");
    const section = document.querySelector("#constellation");

    starButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (!button.classList.contains("is-lit")) {
          button.classList.add("is-lit");
          button.setAttribute("aria-pressed", "true");
          litStars += 1;
        }

        if (litStars === 3) {
          status.textContent = "三颗星连在一起，刚好是一句：我喜欢你。";
          status.classList.add("is-complete");
          section.classList.add("is-complete");
        } else {
          status.textContent = `已经点亮 ${litStars} 颗，还有 ${3 - litStars} 颗。`;
        }
      });
    });
  }

  function setupAnswers() {
    const answerContent = document.querySelector("#answer-content");
    const response = document.querySelector("#response");
    const responseTitle = document.querySelector("#response-title");
    const responseCopy = document.querySelector("#response-copy");
    const answerButtons = document.querySelectorAll("[data-answer]");
    const replayButton = document.querySelector("#replay");

    answerButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const willing = button.dataset.answer === "yes";
        answerContent.hidden = true;
        response.hidden = false;

        if (willing) {
          responseTitle.textContent = "那就，从下一次见面开始。";
          responseCopy.textContent = "谢谢你愿意给我这个机会。以后不用一下子走很远，我们一步一步，慢慢来。";
          finaleScene.burst("yes");
        } else {
          responseTitle.textContent = "好，我把心意安静放在这里。";
          responseCopy.textContent = "你可以慢慢想。我不会催你，也不会因为答案来得晚，就否定今晚的认真。";
          finaleScene.burst("later");
        }
      });
    });

    replayButton.addEventListener("click", () => window.location.reload());
  }

  gateScene.start();
  setupRevealObserver();
  setupChapterObserver();
  setupSceneObserver();
  setupConstellation();
  setupAnswers();
  openButton.addEventListener("click", openExperience);
})();
