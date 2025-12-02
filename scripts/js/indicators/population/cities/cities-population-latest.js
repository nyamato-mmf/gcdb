// Define colors for each City_Name
let Colors_array_cities_population_latest = [];
let Color_obj_cities_population_latest = {};

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // Set up canvas size management
    const canvas = document.getElementById("cities-population-latest");
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
            Colors_array_cities_population_latest = Papa.parse(csvText, { header: true, dynamicTyping: true }).data;
            
            // Convert array into an object for easier lookup
            Color_obj_cities_population_latest = Colors_array_cities_population_latest.reduce((acc, entry) => {
                acc[entry.City_Code] = entry.Color_Code;
                return acc;
            }, {});
            
            // Now load population data
            return fetch("./data/csv/population/cities/cities-population-timeseries.csv");
        })
        .then(response => response.text())
        .then(csvText => {

            // Target year
            const TARGET_YEAR = "2020";

            // Parse CSV into an array of objects
            const data = Papa.parse(csvText, { header: true, dynamicTyping: true }).data;

            // Remove empty or invalid rows
            const filteredData = data.filter(entry => entry["City_Name"] && entry["City_Code"]); 
            
            // Extract labels (City_Name names) and values (populations)
            const countries = filteredData.map(entry => entry["City_Name"]);
            const populations = filteredData.map(entry => Math.floor(entry[TARGET_YEAR]/1000000));
            const backgroundColors = filteredData.map(entry => 
                Color_obj_cities_population_latest[entry["City_Code"]] || "gray" // Default to gray if no color
            );
            
            // Create the chart
            new Chart("cities-population-latest", {
                type: "bar",
                data: {
                    labels: countries, // X-axis labels
                    datasets: [{
                        label: "Population (millions)",
                        data: populations,
                        backgroundColor: backgroundColors // Apply colors
                    }]
                },
                options: {
                    plugins: {
                        legend: {
                            labels: {
                                font: {
                                    size: 16 // legend
                                },
                                generateLabels: function() {
                                    return [{
                                        text: "Population by city", // Graph title
                                        fillStyle: "transparent", // Hide colour box
                                        strokeStyle: "transparent",
                                        hidden: false
                                    }];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                font: {
                                    size: 14 // X-axis
                                }
                            },
                            title: {
                                display: true,
                                text: "City",
                                font: {
                                    size: 18 // X-axis title
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: {
                                    size: 14 // Y-axis
                                }
                            },
                            title: {
                                display: true,
                                text: "Population (millions)",
                                font: {
                                    size: 18 // Y-axis title
                                }
                            },
                            // Set the max value here
                            max: 16  // <-- Change this number to your desired maximum
                        }
                    }
                    
                }
            });
        })
        .catch(error => console.error("Error loading data:", error));
});