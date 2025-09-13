import { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import axios from "axios";
import { API_URL, refreshUser } from "../api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext.jsx";
import "./styles/MoodTrends.css";

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
	BarElement,
} from "chart.js";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
	BarElement
);

// Line chart options
const options = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		title: { display: true, text: "Mood Trends Over Time" },
		legend: { display: true, position: "top" },
		tooltip: {
		callbacks: {
			title: (items) => (items.length ? `Date: ${items[0].label}` : ""),
			label: (context) => `${context.dataset.label}: ${context.raw}%`,
		},
		},
	},
	scales: {
		x: { title: { display: true, text: "Dates" } },
		y: {
		min: 0,
		max: 100,
		title: { display: true, text: "Emotion (%)" },
		ticks: { callback: (value) => `${value}%` },
		},
	},
};

// Doughnut chart options (frequency)
const pieOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		title: {
			display: true,
			text: "Frequency Distribution",
			font: { size: 16 },
		},
		legend: {
			display: true,
			position: "right",
			labels: { boxWidth: 20, padding: 10 },
		},
	},
};

// Bar chart options (intensity)
const barOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		tooltip: { callbacks: { label: (context) => `${context.label}: ${context.raw}%` } },
	},
	scales: {
		y: { min: 0, max: 100, ticks: { callback: (value) => `${value}%` } },
	},
};

function MoodTrends() {
	const [chartData, setChartData] = useState(null);
	const [barChartData, setBarChartData] = useState(null);
	const [pieChartData, setPieChartData] = useState(null);
	const [positiveMessage, setPositiveMessage] = useState("");
	const [showMessage, setShowMessage] = useState(true);
	const [allData, setAllData] = useState(null);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const navigate = useNavigate();
	const { setUser } = useContext(AuthContext);

	// Deterministic color generator
	const emotionColors = useMemo(() => {
		const colors = {};
		const hashColor = (str) => {
			let hash = 0;
			for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
			const hue = Math.abs(hash % 360);
			return `hsl(${hue}, 70%, 60%)`;
		};
		return (emotion) => {
			if (!colors[emotion]) colors[emotion] = hashColor(emotion);
			return colors[emotion];
		};
	}, []);

	const updateCharts = useCallback(
		(data, start, end) => {
			const datesSet = new Set();
			Object.values(data).forEach((arr) => arr.forEach((obj) => datesSet.add(obj.date)));
			let allDates = Array.from(datesSet).sort();
			if (start) allDates = allDates.filter((d) => d >= start);
			if (end) allDates = allDates.filter((d) => d <= end);

			// ✅ Filtered data for selected date range
			const filteredData = {};
			for (const emotion of Object.keys(data)) {
				filteredData[emotion] = data[emotion].filter(
					(obj) => (!start || obj.date >= start) && (!end || obj.date <= end)
				);
			}

			// Line chart (trends over time)
			const datasets = Object.keys(filteredData).map((emotion) => {
			const dateToScore = Object.fromEntries(filteredData[emotion].map((d) => [d.date, d.score]));
			const scores = allDates.map((date) => Math.round((dateToScore[date] || 0) * 100));
			return {
				label: emotion,
				data: scores,
				fill: false,
				borderColor: emotionColors(emotion),
				tension: 0.5,
			};
			});
			setChartData({ labels: allDates, datasets });

			// Bar chart: average intensity per emotion (filtered)
			const intensityTotals = Object.keys(filteredData).map((emotion) => {
				const arr = filteredData[emotion];
				const avg = arr.length ? arr.reduce((acc, obj) => acc + obj.score, 0) / arr.length : 0;
				return { emotion, total: Math.round(avg * 100) };
			});
			const sortedIntensity = [...intensityTotals].sort((a, b) => b.total - a.total);
			setBarChartData({
				labels: sortedIntensity.slice(0, 5).map((e) => e.emotion),
				datasets: [
					{
					label: "Top 5 Emotions by Average Intensity (in %)",
					data: sortedIntensity.slice(0, 5).map((e) => e.total),
					backgroundColor: sortedIntensity.slice(0, 5).map((e) => emotionColors(e.emotion)),
					},
				],
			});

			// Doughnut chart: frequency distribution (filtered)
			const frequencyTotals = Object.keys(filteredData).map((emotion) => ({
				emotion,
				total: filteredData[emotion].length,
			}));
			setPieChartData({
				labels: frequencyTotals.map((e) => e.emotion),
				datasets: [
					{
					data: frequencyTotals.map((e) => e.total),
					backgroundColor: frequencyTotals.map((e) => emotionColors(e.emotion)),
					},
				],
			});
		},
		[emotionColors]
	);


	useEffect(() => {
		const fetchData = () => {
		axios.get(`${API_URL}/journal/moods/`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
			.then((res) => {
				const data = res.data.emotion_trends || {};
				setAllData(data);
				setPositiveMessage(res.data.positive_message || "");
				setShowMessage(true);
				updateCharts(data, startDate, endDate);
			})
			.catch(async (err) => {
				if (err.response?.status === 401) {
					if (localStorage.getItem("token")) {
					const tokendata = await refreshUser(localStorage.getItem("refresh"));
					if (tokendata === "Refresh token expired") {
						localStorage.removeItem("token");
						localStorage.removeItem("refresh");
						setUser(null);
						navigate("/login", { replace: true, state: { message: "Please log in again" } });
					} else {
						localStorage.setItem("token", tokendata.access);
						fetchData();
					}
					} else {
					navigate("/login", { replace: true, state: { message: "Please log in again" } });
					}
				}
			});
		};
		fetchData();
	}, []);

	useEffect(() => {
		if (allData) updateCharts(allData, startDate, endDate);
	}, [startDate, endDate, allData, updateCharts]);

	if (!chartData) return <p className="text-info">Loading mood trends...</p>;

	return (
		<div className="container chart-container">
			{positiveMessage && showMessage && (
				<div className="positive-message">
					<span>{positiveMessage}</span>
					<button className="close-btn" onClick={() => setShowMessage(false)}>×</button>
				</div>
			)}

			<div className="filter-container">
				<label>From: <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
				<label>To: <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
			</div>

			{/* Trend Line */}
			<Line data={chartData} options={options} />

			{/* Bar + Doughnut */}
			<div className="subcharts py-1">
				<div className="chart-item">{barChartData && <Bar data={barChartData} options={barOptions} />}</div>
				<div className="chart-item">{pieChartData && <Doughnut data={pieChartData} options={pieOptions} />}</div>
			</div>
		</div>
	);
}

export default MoodTrends;
