let chartInstance = null;
let updateInterval;

async function connectToLive() {
    const username = document.getElementById('usernameInput').value.trim();
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.style.display = 'none';

    if (!username) {
        errorMsg.textContent = "Please enter a username";
        errorMsg.style.display = 'block';
        return;
    }

    try {
        const response = await fetch('/verify-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (!response.ok) throw new Error();

        document.getElementById('usernameModal').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        startDashboardUpdates();
    } catch (err) {
        errorMsg.textContent = "Invalid username or stream offline";
        errorMsg.style.display = 'block';
    }
}

function startDashboardUpdates() {
    updateDashboard();
    updateInterval = setInterval(updateDashboard, 3000);
}

async function updateComments() {
    try {
        const response = await fetch('/api/comments');
        const comments = await response.json();
        
        const commentsDiv = document.getElementById('comments');
        commentsDiv.innerHTML = comments.map(comment => `
            <div class="comment">
                <div style="margin-bottom: 8px;">
                    <strong style="color: #2d3436;">${comment.unique_id}</strong>
                    <span style="color: #636e72; font-size: 0.9em; margin-left: 10px;">
                        ${new Date(comment.timestamp).toLocaleTimeString()}
                    </span>
                </div>
                <p style="margin: 0; color: #2d3436;">${comment.comment}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating comments:', error);
    }
}

async function updateLikesChart() {
    try {
        const response = await fetch('/api/likes');
        const likesData = await response.json();
        
        const ctx = document.getElementById('likesChart').getContext('2d');
        
        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: likesData.map(u => u.unique_id),
                datasets: [{
                    label: 'Total Likes',
                    data: likesData.map(u => u.total_likes),
                    backgroundColor: '#ff6384',
                    borderColor: '#ff6384',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

function updateDashboard() {
    updateComments();
    updateLikesChart();
}

window.addEventListener('resize', () => {
    if (chartInstance) chartInstance.resize();
});
