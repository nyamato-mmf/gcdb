
// Define colors for each country
let Colors_array_cities_population_timeseries = [];
let Color_obj_cities_population_timeseries = {};

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // Set up canvas size management
    const canvas = document.getElementById("city-population-timeseries");
    const parent = canvas.parentElement;
    
    // Set canvas size based on its parent
    function adjustCanvasSize() {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }
    
    adjustCanvasSize();
    
    // Adjust when window resizes
    window.addEventListener("resize", adjustCanvasSize);
    
    // Load color codes first
    fetch("./data/color_code.csv")
        .then(response => response.text())
        .then(csvText => {
            // Parse CSV into an array of objects
            Colors_array_cities_population_timeseries = Papa.parse(csvText, { header: true, dynamicTyping: true }).data;
            
            // Convert array into an object for easier lookup
            Color_obj_cities_population_timeseries = Colors_array_cities_population_timeseries.reduce((acc, entry) => {
                acc[entry.City_Code] = entry.Color_Code;
                return acc;
            }, {});
            
            // Now load population data
            return fetch("./data/csv/population/cities/cities-population-timeseries.csv");
        })
        .then(response => response.text())
        .then(csvText => {
            
            // Get city parameter from URL (default to TYO if not provided)
            const DEFAULT_CITY = "TYO"; // Define the default city
            const params = new URLSearchParams(window.location.search);
            
            // FIX: Set cityParam to the retrieved value (uppercased) OR the DEFAULT_CITY.
            const cityParam = params.get("city")?.toUpperCase() || DEFAULT_CITY; 

            // Parse CSV into an array of objects
            const data = Papa.parse(csvText, { header: true, dynamicTyping: true }).data;
            
            // Remove empty or invalid rows
            const filteredData = data.filter(entry => entry["City_Code"] === cityParam); 

            // Extract unique years dynamically (excluding "City_Name" and "City_Code")
            const excludeCols = ["City_Name", "City_Code"];
            const years = Object.keys(filteredData[0]).filter(key => !excludeCols.includes(key));

            // Create datasets for each country
            const datasets = filteredData.map(entry => ({
                label: entry["City_Name"], // Country name for legend
                data: years.map(year => Math.floor((entry[year] ?? 0) / 1000000)), // Prevent NaN by using `?? 0`
                borderColor: Color_obj_cities_population_timeseries[entry["City_Code"]] || "gray", // Predefined colour or gray
                fill: false
            }));
            
            // Create the chart
            new Chart("city-population-timeseries", {
                type: "line",
                data: {
                    labels: years, // X-axis: Years
                    datasets: datasets // Multiple countries as datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allow full parent height
                    plugins: {
                        legend: {
                            labels: {
                                font: {
                                    size: 16 // Change legend font size
                                },
                                color: "#666", // Legend text color
                                usePointStyle: false, // Keep the default rectangle shape
                                boxWidth: 20, // Adjust box size
                                generateLabels: (chart) => {
                                    const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                    labels.forEach(label => {
                                        label.fillStyle = "white"; // Set the inside color to white
                                        label.strokeStyle = label.strokeStyle || label.fillStyle; // Keep border color
                                    });
                                    return labels;
                                }
                            }
                        }
                    },                
                    scales: {
                        x: {
                            ticks: {
                                font: {
                                    size: 14 // Change X-axis font size
                                }
                            },
                            title: {
                                display: true,
                                text: "Year",
                                font: {
                                    size: 18 // X-axis title font size
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: {
                                    size: 14 // Change Y-axis font size
                                }
                            },
                            title: {
                                display: true,
                                text: "Population (millions)",
                                font: {
                                    size: 18 // Y-axis title font size
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error("Error loading data:", error));
});
