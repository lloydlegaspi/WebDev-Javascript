$(document).ready(function () {
  // Quiz variables
  let currentQuestion = 0;
  let score = 0;
  let lives = 3;
  let questions = [];
  let answered = false;
  let currentSubject = "";
  let subjectLabels = {
    "web-dev": "Web Development",
    "software-eng": "Software Engineering",
    "ai": "Artificial Intelligence",
    "security": "Information Security"
  };
  let leaderboard =
    JSON.parse(localStorage.getItem("compSciQuizLeaderboard")) || [];

  // Load questions via AJAX
  function loadQuestions(subject) {
    let questionFile;
    
    switch(subject) {
      case "web-dev":
        questionFile = "web-dev-questions.json";
        break;
      case "software-eng":
        questionFile = "software-eng-questions.json";
        break;
      case "ai":
        questionFile = "ai-questions.json";
        break;
      case "security":
        questionFile = "security-questions.json";
        break;
      default:
        questionFile = "web-dev-questions.json";
    }

    return $.ajax({
      url: questionFile,
      dataType: "json",
      success: function (data) {
        questions = data.questions;
        $("#total-questions").text(questions.length);
      },
      error: function (xhr, status, error) {
        console.error("Error loading questions:", error);
        $("#question-text").text(
          "Error loading questions. Please try again later."
        );
      },
    });
  }

  // Initialize quiz
  function initQuiz(subject) {
    currentQuestion = 0;
    score = 0;
    lives = 3;
    currentSubject = subject;

    // Update UI elements
    $("#current-subject")
      .text(subjectLabels[subject])
      .removeClass()
      .addClass(`subject-badge ${subject}`);

    // Show loading state
    $("#question-text").text("Loading questions...");
    $("#choices-container").empty();

    // Load questions via AJAX
    loadQuestions(subject)
      .done(function () {
        questions = shuffleArray(questions).slice(0, 15);
        updateLives();
        updateProgress();
        $("#score").text(score);
        $("#total-questions").text(questions.length);
        showQuestion(currentQuestion);
      })
      .fail(function () {
        $("#question-text").text(
          "Failed to load questions. Please refresh the page and try again."
        );
      });
  }

  // Fisher-Yates shuffle algorithm to randomize questions
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Display current question
  function showQuestion(index) {
    if (index >= questions.length) {
      showResults();
      return;
    }

    const question = questions[index];
    $("#question-text").text(question.question);
    $("#current-question").text(index + 1);
    updateProgress();

    // Clear previous choices
    $("#choices-container").empty();

    // Add new choices
    question.choices.forEach((choice, i) => {
      const choiceBtn = $("<button>")
        .addClass("choice-btn slide-in")
        .text(choice)
        .attr("data-index", i)
        .css("animation-delay", `${i * 0.1}s`);
      $("#choices-container").append(choiceBtn);
    });

    // Reset state
    answered = false;
    $("#feedback").removeClass("correct incorrect").css("opacity", 0);
    $("#next-btn").hide();
  }

  // Handle choice selection
  $(document).on("click", ".choice-btn", function () {
    if (answered) return;

    answered = true;
    const selectedIndex = $(this).data("index");
    const currentQuestionData = questions[currentQuestion];

    // Disable all choice buttons
    $(".choice-btn").prop("disabled", true);

    if (selectedIndex === currentQuestionData.answer) {
      // Correct answer
      $(this).addClass("correct");
      $("#feedback")
        .addClass("correct")
        .text("Correct! Great job!")
        .css("opacity", 1);
      score++;
      $("#score").text(score);
    } else {
      // Incorrect answer
      $(this).addClass("incorrect");
      $(".choice-btn").eq(currentQuestionData.answer).addClass("correct");
      $("#feedback")
        .addClass("incorrect")
        .text("Incorrect! The correct answer is highlighted.")
        .css("opacity", 1);
      lives--;
      updateLives();

      if (lives <= 0) {
        setTimeout(showResults, 1500);
        return;
      }
    }

    $("#next-btn").show().addClass("fade-in");
  });

  // Handle next button click
  $("#next-btn").on("click", function () {
    currentQuestion++;
    if (currentQuestion < questions.length) {
      showQuestion(currentQuestion);
    } else {
      showResults();
    }
  });

  // Update lives display
  function updateLives() {
    $(".heart").each(function (index) {
      if (index < lives) {
        $(this).text("❤️");
      } else {
        $(this).text("💔");
      }
    });
  }

  // Update progress bar
  function updateProgress() {
    const progressPercentage = (currentQuestion / questions.length) * 100;
    $(".progress-bar").css("width", progressPercentage + "%");
  }

  // Show results screen
  function showResults() {
    $("#quiz-screen").hide();
    $("#result-screen").show().addClass("slide-in");
    $("#final-score").text(score);
    
    // Set subject in results
    $("#result-subject")
      .text(subjectLabels[currentSubject])
      .removeClass()
      .addClass(`subject-badge large ${currentSubject}`);

    // Set result message based on score
    let message = "";
    const percentage = (score / questions.length) * 100;

    if (percentage >= 90) {
      message = "Outstanding! You're a computer science expert!";
    } else if (percentage >= 70) {
      message = "Great job! You know your computer science well!";
    } else if (percentage >= 50) {
      message = "Good effort! Keep learning computer science!";
    } else {
      message = "Keep practicing! Computer science takes time to master.";
    }

    $("#result-message").text(message);
  }

  // Save score to leaderboard
  $("#save-score-btn").on("click", function () {
    const username = $("#username").val().trim();
    if (!username) {
      alert("Please enter your name to save your score.");
      return;
    }

    const newScore = {
      name: username,
      subject: currentSubject,
      subjectLabel: subjectLabels[currentSubject],
      score: score,
      date: new Date().toLocaleDateString(),
    };

    leaderboard.push(newScore);
    leaderboard.sort((a, b) => b.score - a.score);
    
    localStorage.setItem("compSciQuizLeaderboard", JSON.stringify(leaderboard));
    $("#save-score-section").html("<p>Score saved successfully!</p>");
    updateLeaderboard();
  });

  // Update leaderboard display
  function updateLeaderboard(filterSubject = "all") {
    const leaderboardBody = $("#leaderboard-body");
    leaderboardBody.empty();

    let filteredLeaderboard = leaderboard;
    if (filterSubject !== "all") {
      filteredLeaderboard = leaderboard.filter(entry => entry.subject === filterSubject);
    }

    if (filteredLeaderboard.length === 0) {
      leaderboardBody.append(
        '<tr><td colspan="5" style="text-align: center;">No scores yet. Be the first!</td></tr>'
      );
    } else {
      filteredLeaderboard.forEach((entry, index) => {
        const row = $("<tr>");
        row.append(`<td>${index + 1}</td>`);
        row.append(`<td>${entry.name}</td>`);
        
        // Add subject badge
        const subjectBadge = $(`<span class="subject-badge ${entry.subject}">`)
          .text(entry.subjectLabel || subjectLabels[entry.subject]);
        row.append($("<td>").append(subjectBadge));
        
        row.append(`<td>${entry.score}</td>`);
        row.append(`<td>${entry.date}</td>`);
        leaderboardBody.append(row);
      });
    }
  }

  // Subject selection
  $(".subject-card").on("click", function() {
    const subject = $(this).data("subject");
    
    // Highlight selected subject
    $(".subject-card").removeClass("selected");
    $(this).addClass("selected");
    
    // Wait a moment to show the selection before proceeding
    setTimeout(function() {
      $("#start-screen").hide();
      $("#quiz-screen").show().addClass("slide-in");
      initQuiz(subject);
    }, 500);
  });

  // Subject filter change
  $("#subject-filter").on("change", function() {
    const filterSubject = $(this).val();
    updateLeaderboard(filterSubject);
  });

  // View Leaderboard button
  $("#view-leaderboard-btn, #home-leaderboard-btn").on("click", function () {
    $("#result-screen, #start-screen").hide();
    $("#leaderboard-screen").show().addClass("slide-in");
    updateLeaderboard();
  });

  // Back button
  $(".back-btn").on("click", function () {
    $("#leaderboard-screen").hide();
    
    // Determine which screen to go back to
    if ($("#result-screen").data("visible")) {
      $("#result-screen").show().addClass("slide-in");
    } else {
      $("#start-screen").show().addClass("slide-in");
    }
  });

  // Restart button
  $(".restart-btn").on("click", function () {
    $("#result-screen").hide();
    $("#start-screen").show().addClass("slide-in");
  });

  // Keep track of which screen was visible
  $("#result-screen").on("show", function() {
    $(this).data("visible", true);
  }).on("hide", function() {
    $(this).data("visible", false);
  });

  // Theme toggle functionality
  $("#theme-toggle").on("click", function () {
    $("body").toggleClass("light-mode");
    $(".light-icon, .dark-icon").toggle();

    // Save preference to localStorage
    const isDarkMode = !$("body").hasClass("light-mode");
    localStorage.setItem("darkMode", isDarkMode);
  });

  // Music toggle functionality
  const backgroundMusic = document.getElementById("background-music");
  $("#music-toggle").on("click", function () {
    $(".music-on, .music-off").toggle();

    if (backgroundMusic.paused) {
      backgroundMusic.play();
      localStorage.setItem("musicOn", "true");
    } else {
      backgroundMusic.pause();
      localStorage.setItem("musicOn", "false");
    }
  });

  // Load user preferences on page load
  const isDarkMode = localStorage.getItem("darkMode") !== "false";
  if (!isDarkMode) {
    $("body").addClass("light-mode");
    $(".light-icon, .dark-icon").toggle();
  }

  // Apply saved music preference
  const musicOn = localStorage.getItem("musicOn") === "true";
  if (musicOn) {
    backgroundMusic
      .play()
      .catch((e) => console.log("Auto-play prevented by browser"));
    $(".music-on").show();
    $(".music-off").hide();
  } else {
    $(".music-on").hide();
    $(".music-off").show();
  }

  // Initialize on page load
  updateLeaderboard();
});
