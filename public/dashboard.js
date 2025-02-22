let likesChart, interactionsChart;

async function connectToLive() {
  const username = document.getElementById("usernameInput").value.trim();
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.style.display = "none";

  if (!username) {
    errorMsg.textContent = "Please enter a username";
    errorMsg.style.display = "block";
    return;
  }

  try {
    const response = await fetch("/verify-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) throw new Error();

    document.getElementById("usernameModal").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    startUpdates();
  } catch (err) {
    errorMsg.textContent = "Invalid username or stream offline";
    errorMsg.style.display = "block";
  }
}

function startUpdates() {
  updateDashboard();
  setInterval(updateDashboard, 3000);
}

async function updateDashboard() {
  updateComments();
  updateLikesChart();
  updateGifters();
  updateFollowers();
  updateInteractionsChart();
  updateTopLikers();
}

// Update individual components
async function updateComments() {
  try {
    const comments = await (await fetch("/api/comments")).json();
    document.getElementById("comments").innerHTML = comments
      .map(
        (c) => `
            <div class="comment">
                <strong>${c.unique_id}</strong>
                <span style="color: #666; font-size: 0.9em;">
                    ${new Date(c.timestamp).toLocaleTimeString()}
                </span>
                <p>${c.comment}</p>
            </div>
        `
      )
      .join("");
  } catch {}
}

async function updateLikesChart() {
  try {
    const data = await (await fetch("/api/likes")).json();
    const ctx = document.getElementById("likesChart").getContext("2d");

    if (likesChart) likesChart.destroy();

    likesChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((u) => u.unique_id),
        datasets: [
          {
            label: "Total Likes",
            data: data.map((u) => u.total_likes),
            backgroundColor: "#ff6384",
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  } catch {}
}

async function updateGifters() {
  try {
    const gifts = await (await fetch("/api/gifts")).json();
    document.getElementById("gifters").innerHTML = gifts
      .map(
        (g) => `
            <div class="gift-item">
                <strong>${g.unique_id}</strong>
                <span>${g.gift_name} × ${g.total_count}</span>
            </div>
        `
      )
      .join("");
  } catch {}
}

async function updateFollowers() {
  try {
    const followers = await (await fetch("/api/followers")).json();
    document.getElementById("followers").innerHTML = followers
      .map(
        (f) => `
            <div class="follower-item">
                <strong>${f.unique_id}</strong>
                <span>${new Date(f.timestamp).toLocaleTimeString()}</span>
            </div>
        `
      )
      .join("");
  } catch {}
}

async function updateTopLikers() {
  try {
    const response = await fetch("/api/top-likers");
    const likers = await response.json();

    const formatted = likers.map(
      (liker, index) =>
        (document.getElementById(`likersText${index + 1}`).textContent = `@${
          liker.nickname
        } namba ${index + 1} ametaptap mara: ${liker.total_likes}`)
    );
  } catch (error) {
    console.error("Error updating top likers:", error);
  }
}

// Add copy function
function copyLikersText(elementid) {
  const text = document.getElementById(`${elementid}`).textContent;
  navigator.clipboard.writeText(text).then(() => {
    console.log("Copied to clipboard!");
  });
}

/* async function updateTopLikers() {
  try {
    const response = await fetch("/api/top-likers");
    const likers = await response.json();

    const formatted = likers
      .map(
        (liker, index) =>
          ` @${liker.nickname} ame👍 mara ${liker.total_likes}`
      )
      .join(", ");

    const text = `( ͡° ͜ʖ ͡°)Kwa kulike ${formatted.replace(/,\s([^,]*)$/, " and $1")}`;
    document.getElementById("likersText").textContent = text;
    document.getElementById("likersText").textContent = text;
  } catch (error) {
    console.error("Error updating top likers:", error);
  }
} */

async function updateInteractionsChart() {
  try {
    const data = await (await fetch("/api/interactions")).json();
    const ctx = document.getElementById("interactionsChart").getContext("2d");

    if (interactionsChart) interactionsChart.destroy();

    interactionsChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.map((u) => u.unique_id),
        datasets: [
          {
            data: data.map((u) => u.total_interactions),
            backgroundColor: ["#ff6384", "#36a2eb", "#4bc0c0"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} interactions`,
            },
          },
        },
      },
    });
  } catch {}
}

// Handle window resize
window.addEventListener("resize", () => {
  if (likesChart) likesChart.resize();
  if (interactionsChart) interactionsChart.resize();
});
