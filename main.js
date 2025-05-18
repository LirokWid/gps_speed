let lastSpeed = null;
let lastTime = null;
let watchId = null;
const MAX_POINTS = 50; // 👈 Set how many points to show in graph

const speedEl = document.getElementById('speed');
const accelEl = document.getElementById('acceleration');
const accuracyEl = document.getElementById('accuracy');
const statusEl = document.getElementById('status');

const gpsChart = new Chart(document.getElementById('gpsChart').getContext('2d'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Speed (km/h)',
                borderColor: (ctx) => getAlphaColor(ctx, 'blue'),
                data: [],
                fill: false,
                tension: 0.3,
                yAxisID: 'y',
                segment: {
                    borderColor: (ctx) => getAlphaColor(ctx, 'blue')
                }
            },
            {
                label: 'GPS Accel (m/s²)',
                borderColor: (ctx) => getAlphaColor(ctx, 'red'),
                data: [],
                fill: false,
                tension: 0.3,
                yAxisID: 'y1',
                segment: {
                    borderColor: (ctx) => getAlphaColor(ctx, 'red')
                }
            }
        ]
    },
    options: {
        animation: false,
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false
        },
        stacked: false,
        scales: {
            x: { ticks: { display: false } },
            y: {
                type: 'linear',
                position: 'left',
                beginAtZero: true,
                title: { display: true, text: 'Speed (km/h)' }
            },
            y1: {
                type: 'linear',
                position: 'right',
                beginAtZero: true,
                grid: { drawOnChartArea: false },
                title: { display: true, text: 'Acceleration (m/s²)' }
            }
        }
    }
});

function getAlphaColor(ctx, baseColor)
{
    ctx.p0DataIndex = undefined;
    const i = ctx.p0DataIndex; // Index du point précédent
    const dataset = ctx.dataset.data;
    const point = dataset[i];

    // Défaut : opaque
    let alpha = 1;
    if (point && point.accuracy !== undefined && point.accuracy > 30) {
        alpha = 0.2; // Moins de confiance → transparent
    }

    // Appliquer transparence
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.fillStyle = baseColor;
    tempCtx.globalAlpha = alpha;
    tempCtx.fillRect(0, 0, 1, 1);
    return tempCtx.fillStyle;
}


function addData(chart, speed, accel, accuracy)
{
    const now = new Date().toLocaleTimeString();
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push({ x: now, y: speed, accuracy });
    chart.data.datasets[1].data.push({ x: now, y: accel, accuracy });

    if (chart.data.labels.length > MAX_POINTS)
    {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
    }
    chart.update();
}


function resetTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    lastSpeed = null;
    lastTime = null;
}

function startTracking()
{
    resetTracking();

    if (!navigator.geolocation)
    {
        alert("Geolocation not supported.");
        return;
    }

    statusEl.textContent = "Waiting for GPS signal...";

    navigator.geolocation.watchPosition(
        (pos) =>
        {
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

            if (speed !== null)
            {
                const kmh = parseFloat((speed * 3.6).toFixed(1)); // Convert m/s to km/h
                speedEl.textContent = kmh;

                let accel = 0;
                if (lastSpeed !== null && lastTime !== null)
                {
                    const dt = (now - lastTime) / 1000;
                    const dv = speed - lastSpeed;
                    accel = parseFloat((dv / dt).toFixed(2));
                }

                accelEl.textContent = accel;
                addData(gpsChart, kmh, accel, accuracy);
                lastSpeed = speed;
                lastTime = now;
            }
        },
        (err) =>
        {
            if (err.code === err.TIMEOUT) {
                statusEl.textContent += "GPS signal timeout, retrying...";
                setTimeout(startTracking, 5000);
            } else {
                statusEl.textContent = "Error getting location.";
            }
        },
        {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000
        }
    );
}

function stopTracking() {
    resetTracking();
    speedEl.textContent = "0.0";
    accelEl.textContent = "0.0";
    accuracyEl.textContent = "0.0";
    statusEl.textContent = "Tracking stopped.";
}

