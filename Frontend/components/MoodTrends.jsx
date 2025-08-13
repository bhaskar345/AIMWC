import { useContext } from 'react';
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import {API_URL, refreshUser} from "../api" 
import { useNavigate } from "react-router-dom";
import { AuthContext } from '../contexts/AuthContext.jsx';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
import './styles/MoodTrends.css'


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);
  
const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      	title: {
			display: true,
			text: 'Mood Trends Over Time',
      	},
      	legend: {
        	display: true,
        	position: 'top',
      	},
    },
}; 


function MoodTrends() {
  	const [chartData, setChartData] = useState(null);
	const navigate = useNavigate();
	const { user, setUser } = useContext(AuthContext);

	useEffect(() => {
		axios.get(`${API_URL}/journal/moods/`,{ headers: { Authorization: `Bearer ${localStorage.getItem('token')}`}}).then(res => {
			const data = res.data;
			const datesSet = new Set();
			Object.values(data).forEach(arr => arr.forEach(obj => datesSet.add(obj.date)));
			const allDates = Array.from(datesSet).sort();
			const datasets = Object.keys(data).map(emotion => {
				const dateToScore = Object.fromEntries(data[emotion].map(d => [d.date, d.score]));
				const scores = allDates.map(date => dateToScore[date] || 0);
				return { label: emotion, data: scores, fill: false, borderColor: `hsl(${Math.random()*360},70%,60%)`, tension: 0.5};
			});
			setChartData({
				labels: allDates,
				datasets: datasets
			});
		}).catch(async err => {
			if (err.response.statusText=="Unauthorized"){
				if (localStorage.getItem('token')){
					const tokendata = await refreshUser(localStorage.getItem("refresh"));
					if (tokendata=="Refresh token expired"){
						localStorage.removeItem('token');
        				localStorage.removeItem('refresh');
                        setUser(null);
						navigate('/login', { replace: true, state: { message: 'Please log in again' } });
					} else {
						localStorage.setItem('token', tokendata.access);
						axios.get(`${API_URL}/journal/moods/`,{ headers: { Authorization: `Bearer ${localStorage.getItem('token')}`}}).then(res => {
							const data = res.data;
							const datesSet = new Set();
							Object.values(data).forEach(arr => arr.forEach(obj => datesSet.add(obj.date)));
							const allDates = Array.from(datesSet).sort();
							const datasets = Object.keys(data).map(emotion => {
								const dateToScore = Object.fromEntries(data[emotion].map(d => [d.date, d.score]));
								const scores = allDates.map(date => dateToScore[date] || 0);
								return { label: emotion, data: scores, fill: false, borderColor: `hsl(${Math.random()*360},70%,60%)`, tension: 0.5};
							});
							setChartData({
								labels: allDates,
								datasets: datasets
							});
						});
					}
				} else{
					navigate('/login', { replace: true, state: { message: 'Please log in again' } });
				}
			};
		});
	}, []);

	if (!chartData) return <p>Loading mood trends...</p>;

	return (
		<div className="container chart-container">
			<Line data={chartData} options={options}/>
		</div>
	);
}

export default MoodTrends;
