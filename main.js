let lastSpeed = null;
let lastTime = null;

const speedEl = document.getElementById('speed');
const accelEl = document.getElementById('acceleration');
const accuracyEl = document.getElementById('accuracy');
const statusEl = document.getElementById('status');

const speedChart = new Chart(document.getElementById('speedChart').getContext('2d'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Speed (km/h)',
            borderColor: 'blue',
            data: [],
            fill: false,
            tension: 0.3
        }]
    },
    options: {
        animation: false,
        scales: { x: { ticks: { display: false } }, y: { beginAtZero: true } }
    }
});

const gpsAccelChart = new Chart(document.getElementById('gpsAccelChart').getContext('2d'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'GPS Accel (m/s²)',
            borderColor: 'green',
            data: [],
            fill: false,
            tension: 0.3
        }]
    },
    options: {
        animation: false,
        scales: { x: { ticks: { display: false } }, y: { beginAtZero: true } }
    }
});

function addData(chart, value) {
    const now = new Date().toLocaleTimeString();
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(value);
    if (chart.data.labels.length > 50) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.update();
}

function startTracking() {
    if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        return;
    }

    statusEl.textContent = "Waiting for GPS signal...";

    navigator.geolocation.watchPosition(
        (pos) => {
            const speed = pos.coords.speed;
            const accuracy = pos.coords.accuracy;
            const now = Date.now();

            accuracyEl.textContent = accuracy.toFixed(1);

            if (accuracy > 100 || speed === null) {
                statusEl.textContent = "Waiting for satellites...";
            } else if (accuracy <= 30) {
                statusEl.textContent = "GPS locked.";
            } else {
                statusEl.textContent = "Weak GPS signal.";
            }

            if (speed !== null) {
                const kmh = (speed * 3.6).toFixed(1);
                speedEl.textContent = kmh;
                addData(speedChart, parseFloat(kmh));

                if (lastSpeed !== null && lastTime !== null) {
                    const dt = (now - lastTime) / 1000;
                    const dv = speed - lastSpeed;
                    const accel = (dv / dt).toFixed(2);
                    accelEl.textContent = accel;
                    addData(gpsAccelChart, parseFloat(accel));
                }

                lastSpeed = speed;
                lastTime = now;
            }
        },
        (err) => {
            alert("Geolocation error: " + err.message);
            statusEl.textContent = "Error getting location.";
        },
        {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000
        }
    );
}
