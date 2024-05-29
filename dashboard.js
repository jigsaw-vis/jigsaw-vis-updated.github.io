document.addEventListener('DOMContentLoaded', (event) => {
    document.querySelector('.tab button').click();
});

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    if (tabName === 'Trajectory') {
        drawTrajectoryChart();
    } else if (tabName === 'Network') {
        drawNetworkChart();
    } else if (tabName === 'Interaction') {
        drawInteractionChart();
    }
}

d3.select("#trajectoryChart").selectAll("*").remove();
const svg = d3.select("#trajectoryChart").append("svg")
    .attr("width", "100%")
    .attr("height", "100%");

var trajectory;

function drawTrajectoryChart() {

    generateHeatmap();

    var data = puzzles;

    trajectory = svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function(d, i) {
            return d.xpos;
        })
        .attr("cy", function(d, i) {
            return d.ypos;
        })
        .attr("r", function(d, i) {
            return 5;
        })
        // .attr('transform', function(d, i) {
        //     return `translate(${-d.width / 2} ${-d.height / 2})`
        // })
        .style("fill", "rgba(255, 0, 0, 0.8)")
        .style("stroke", "black")
        .on("mouseover", function(d, i) {
            d3.select(this)
                .transition()
                .attr("r", 8)
                .style("fill", function(d, i) {
                    return "rgba(255, 0, 0, 1.0)";
                });
        })
        .on("mouseout", function(d, i) {
            d3.select(this)
                .transition()
                .attr("r", 5)
                .style("fill", function(d, i) {
                    return "rgba(255, 0, 0, 0.8)";
                });
        });

    updateTrajectoryView();
}


var generateHeatmap = function() {

    var heatmapData = cellData;

    //console.log("generate heatmap...")

    heatmap = svg.selectAll("rect")
        .data(heatmapData)
        .enter()
        .append("rect")
        .attr('transform', function(d, i) {
            return `translate(${-d.width / 2} ${-d.height / 2})`
        })
        .attr("id", "heatmapCell")
        .attr("x", function(d, i) {
            return d.xPos;
        })
        .attr("y", function(d, i) {
            return d.yPos;
        })
        .attr("width", function(d, i) {
            return d.width;
        })
        .attr("height", function(d, i) {
            return d.height;
        })
        .style("fill", "rgb(200, 200, 200)")
        .style("stroke", "black");

    generateColorLabel();

}

var generateColorLabel = function() {

    // Modified version of: https://gist.github.com/HarryStevens/6eb89487fc99ad016723b901cbd57fde (Last access: jan. 19, 2023)

    dataVal = linspaceFunc(0, 1, 251)
    dataColor = [];
    for (var i = 0; i < dataVal.length; i++) {
        dataColor.push(d3.interpolateRdYlBu(dataVal[i]));
    }

    var data = [];
    for (var i = 0; i < dataVal.length; i++) {
        var element = { "index": i, "color": dataColor[i], "value": dataVal[i] }
        data.push(element);
    }
    var extent = d3.extent(data, d => d.value);

    var padding = 10;
    var width = 320;
    var innerWidth = width - (padding * 2);
    var barHeight = 8;

    var xScale = d3.scaleLinear()
        .range([0, innerWidth])
        .domain(extent);

    var xTicks = data.filter(f => f.index % 50.0 === 0).map(d => d.value);

    var xAxis = d3.axisBottom(xScale)
        .tickSize(barHeight * 2)
        .tickValues(xTicks);

    //var svg = d3.select("body").append("svg").attr("width", width).attr("height", height);
    var g = svg.append("g").attr("transform", "translate(" + 275 + ", 25)");

    var defs = svg.append("defs");
    var linearGradient = defs.append("linearGradient").attr("id", "myGradient");
    linearGradient.selectAll("stop")
        .data(data)
        .enter().append("stop")
        .attr("offset", d => ((d.value - extent[0]) / (extent[1] - extent[0]) * 100) + "%")
        .attr("stop-color", d => d.color);

    g.append("rect")
        .attr("width", innerWidth)
        .attr("height", barHeight)
        .style("fill", "url(#myGradient)");

    g.append("g")
        .call(xAxis)
        .select(".domain").remove();

}

var updateHeatmap = function() {

    var heatmapData = cellData;

    var noZeroes = heatmapData.filter(function(d) { return parseFloat(d.timer) !== 0; });
    var minTime = d3.min(noZeroes, function(d) {
        return parseFloat(d.timer);
    });

    var maxTime = d3.max(heatmapData, function(d) {
        return parseFloat(d.timer);
    })

    svg.selectAll("#heatmapCell")
        .data(heatmapData)
        .transition()
        .style("fill", function(d, i) {
            if (parseFloat(d.timer) == 0.0) {
                return "rgb(200, 200, 200);"
            } else {
                //
                if ((maxTime - minTime) !== 0) {
                    return d3.interpolateRdYlBu(1 - ((parseFloat(d.timer) - minTime) / (maxTime - minTime)));
                    //return d3.interpolateReds(1 - ((parseFloat(d.timer) - minTime) / (maxTime - minTime)));
                } else {
                    return d3.interpolateRdYlBu(0);
                    //return d3.interpolateReds(0);

                }
            }
        });
}

function updateTrajectoryView() {
    var data = trajectoryData.filter(d => d && d.cx !== undefined && d.cy !== undefined); // Filter out invalid data points

    if (data.length === 0) {
        console.warn("No valid trajectory data available.");
        return;
    }

    var svg = d3.select("svg"); // Ensure you have the correct svg selection

    // Define the line generator
    var line = d3.line()
        .x((d) => d.cx)
        .y((d) => d.cy)
        .curve(d3.curveNatural);

    // Find min and max time values for color scaling
    var minv = d3.min(data, (d) => d.millisec);
    var maxv = d3.max(data, (d) => d.millisec);

    // Define the color scale
    var colorScale = d3.scaleSequential()
        .domain([minv, maxv])
        .interpolator(d3.interpolateCool);

    // Create a gradient definition
    var gradientID = "trajectoryGradient" + trajectoryID; // Unique ID for each gradient
    var gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", gradientID)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", data[0].cx)
        .attr("y1", data[0].cy)
        .attr("x2", data[data.length - 1].cx)
        .attr("y2", data[data.length - 1].cy);

    // Add gradient stops
    gradient.selectAll("stop")
        .data(data)
        .enter().append("stop")
        .attr("offset", (d, i) => i / (data.length - 1))
        .attr("stop-color", (d) => colorScale(d.millisec));

    // Append the path
    svg.append("path")
        .datum(data)
        .attr("class", "trajectoryPath")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "url(#" + gradientID + ")")
        .attr('stroke-width', 5)
        .attr('opacity', 0.8)
        .on("mouseover", function(d, i) {
            d3.select(this)
                .transition()
                .attr('stroke-width', 8);
        })
        .on("mouseout", function(d, i) {
            d3.select(this)
                .transition()
                .attr('stroke-width', 5);
        });

    // Call additional update functions if needed
    updateHeatmap();
    if (trajectoryData.length > 0) {
        addStopNode(data.length - 1);
        trajectoryData.length = 0; // Reset trajectoryData after displaying
    }

    trajectoryID++; // Increment trajectoryID for the next trajectory
}



var addStopNode = function(index) {

        var tempArray = []
        tempArray.push(trajectoryData[index]);
        console.log(trajectoryData);
        var data = tempArray;

        svg.append("circle")
            .data(data)
            .attr("class", function(d, i) {
                return "circle" + d.trajectoryID
            })
            .attr("cx", function(d, i) {
                return d.cx;
            })
            .attr("cy", function(d, i) {
                return d.cy;
            })
            .attr("r", function(d, i) {
                return 5;
            })
            //   .attr('transform', function (d, i) {
            //       return `translate(${-d.width / 2} ${-d.height / 2})`
            //   })
            .style("fill", function(d, i) {
                // var cb = document.getElementById('trajectory#' + d.trajectoryID);
                // if (cb.checked) {
                return "rgba(0, 255, 0, 1.0)";
                // } else {
                //     return "rgba(0, 255, 0, 0.0)";
                // }
            })
            .style("stroke", function(d, i) {
                // var cb = document.getElementById('trajectory#' + d.trajectoryID);
                // if (cb.checked) {
                return "black";
                //  } else {
                //      return "none";
                //  }
            });

    }
    /*
    var addNewTrajectory = function () {

        var existingPaths = trajectoryData.map(function (obj) { return obj.trajectoryID; });
        existingPaths = existingPaths.filter(function (v, i) { return existingPaths.indexOf(v) == i; });



        var filterPuzzleWithId = [];

        existingPaths.forEach(path => {
            trajectoryData.forEach(element => {
                if (path == element.trajectoryID) {
                    filterPuzzleWithId.push(element);
                }

            });
        });
    }
    */

/*function generateNewCheckbox(puzzleId) {

    if (generatedCheckboxes.includes(puzzleId)) {
        //return false;
    } else {

        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = false;
        checkbox.id = 'trajectory#' + puzzleId;
        checkbox.name = 'interest';
        checkbox.value = 'trajectory#' + puzzleId;

        var label = document.createElement('label')
        label.htmlFor = ' trajectory#' + puzzleId;
        label.appendChild(document.createTextNode('trajectory#' + puzzleId));

        var br = document.createElement('br');

        var container = document.getElementById('filterMenu');
        container.appendChild(checkbox);
        container.appendChild(label);
        container.appendChild(br);

        generatedCheckboxes.push(puzzleId);

        checkbox.addEventListener('change', function() {
            if (checkbox.checked == true) {
                d3.selectAll(".path" + puzzleId)
                    //.data(trajectoryData)
                    .transition()
                    .duration(500)
                    .style("stroke", (d, i) => {
                        return "rgba(244, 40, 244, 0.8)";
                    })
                d3.selectAll(".circle" + puzzleId)
                    //.data(trajectoryData)
                    .transition()
                    .duration(600)
                    .style("fill", "rgba(0, 255, 0, 0.8)")
                    .style("stroke", "black");
            } else {
                d3.selectAll(".path" + puzzleId)
                    // .data(trajectoryData)
                    .transition()
                    .duration(500)
                    .style("stroke", (d, i) => {
                        return "rgba(244, 40, 244, 0.0)";
                    })
                d3.selectAll(".circle" + puzzleId)
                    //.data(trajectoryData)
                    .transition()
                    .duration(600)
                    .style("fill", "rgba(0, 255, 0, 0.0)")
                    .style("stroke", "none");
            }
        });

    }
}
*/

function linspaceFunc(startValue, stopValue, cardinality) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
        arr.push(startValue + (step * i));
    }
    return arr;
}
/*
    d3.select("#trajectoryChart").selectAll("*").remove();
    const svg = d3.select("#trajectoryChart").append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const data = trajectoryData; // Assuming trajectoryData is accessible here

    const colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain(d3.extent(data, d => d.millisec));

    const line = d3.line()
        .x(d => d.cx)
        .y(d => d.cy);

    svg.selectAll("path")
        .data([data])
        .enter()
        .append("path")
        .attr("d", line(data))
        .attr("stroke", d => colorScale(d.millisec))
        .attr("stroke-width", 2)
        .attr("fill", "none");*/


// function drawNetworkChart() {
//     d3.select("#networkChart").selectAll("*").remove();
//     const svg = d3.select("#networkChart").append("svg")
//         .attr("width", "100%")
//         .attr("height", "100%");

//     // Dummy data for example
//     const nodes = [
//         { id: 1, group: 1 },
//         { id: 2, group: 2 },
//         { id: 3, group: 2 },
//         { id: 4, group: 1 },
//     ];

//     var data = puzzles;

//     data.forEach((number, index) => {
//         nodes.push({
//             id: index,
//             value: number,
//             group: 1
//         });
//     });



//     const links = [
//         { source: 1, target: 2 },
//         { source: 2, target: 3 },
//         { source: 3, target: 4 },
//         { source: 4, target: 1 },
//     ];

//     const simulation = d3.forceSimulation(nodes)
//         .force("link", d3.forceLink(links).id(d => d.id).distance(100))
//         .force("charge", d3.forceManyBody().strength(-30))
//         .force("center", d3.forceCenter(svg.node().clientWidth / 2, svg.node().clientHeight / 2));

//     const link = svg.append("g")
//         .attr("stroke", "#999")
//         .attr("stroke-opacity", 0.6)
//         .selectAll("line")
//         .data(links)
//         .enter().append("line")
//         .attr("stroke-width", 2);

//     const node = svg.append("g")
//         .attr("stroke", "#fff")
//         .attr("stroke-width", 1.5)
//         .selectAll("circle")
//         .data(nodes)
//         .enter().append("circle")
//         .attr("r", 8)
//         .attr("fill", d => d.group === 1 ? "blue" : "green")
//         .call(drag(simulation));

//     node.append("title")
//         .text(d => d.id);

//     simulation.on("tick", () => {
//         link
//             .attr("x1", d => d.source.x)
//             .attr("y1", d => d.source.y)
//             .attr("x2", d => d.target.x)
//             .attr("y2", d => d.target.y);

//         node
//             .attr("cx", d => d.x)
//             .attr("cy", d => d.y);
//     });

//     function drag(simulation) {
//         return d3.drag()
//             .on("start", (event, d) => {
//                 if (!event.active) simulation.alphaTarget(0.3).restart();
//                 d.fx = d.x;
//                 d.fy = d.y;
//             })
//             .on("drag", (event, d) => {
//                 d.fx = event.x;
//                 d.fy = event.y;
//             })
//             .on("end", (event, d) => {
//                 if (!event.active) simulation.alphaTarget(0);
//                 d.fx = null;
//                 d.fy = null;
//             });
//     }
// }
function drawNetworkChart() {
    // Clear existing elements and append a new SVG element for the network chart.
    d3.select("#networkChart").selectAll("*").remove();
    const svg = d3.select("#networkChart").append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    // Initialize nodes and links from interactions
    const nodes = {};
    const links = [];

    interactions.forEach(interaction => {
        if (!nodes[interaction.source]) {
            nodes[interaction.source] = { id: interaction.source, degree: 0 };
        }
        if (!nodes[interaction.target]) {
            nodes[interaction.target] = { id: interaction.target, degree: 0 };
        }
        nodes[interaction.source].degree += 1;
        nodes[interaction.target].degree += 1;

        // Add link
        links.push({
            source: interaction.source,
            target: interaction.target,
            selfLoop: interaction.source === interaction.target
        });
    });

    const nodesArray = Object.values(nodes);

    // Initialize the force simulation
    const simulation = d3.forceSimulation(nodesArray)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(svg.node().clientWidth / 2, svg.node().clientHeight / 2))
        .on("tick", ticked);

    // Draw the links (edges)
    let link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    // Draw the nodes
    let node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodesArray)
        .enter().append("circle")
        .attr("r", d => 5 + d.degree * 2) // Radius based on degree
        .attr("fill", "blue")
        .call(drag(simulation));

    node.append("title")
        .text(d => `Node ${d.id}\nDegree: ${d.degree}`);

    // Function to handle the force simulation ticks
    function ticked() {
        link.attr("d", function(d) {
            const x1 = d.source.x,
                y1 = d.source.y,
                x2 = d.target.x,
                y2 = d.target.y;

            if (d.selfLoop) {
                // Draw self-loop as an arc
                const dr = 30; // Self-loop radius
                return `M${x1},${y1}A${dr},${dr} 0 1,1 ${x1+1},${y1+1}`;
            } else {
                return `M${x1},${y1}L${x2},${y2}`;
            }
        });

        node.attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }

    // Function to handle dragging behavior
    function drag(simulation) {
        return d3.drag()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }
}

function drawInteractionChart() {
    d3.select("#interactionChart").selectAll("*").remove();
    const svg = d3.select("#interactionChart").append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const data = trajectoryData; // Assuming trajectoryData is accessible here

    const pieces = Array.from(new Set(data.map(d => d.trajectoryID)));

    pieces.forEach((piece, index) => {
        svg.append("circle")
            .attr("cx", 50)
            .attr("cy", index * 30 + 50)
            .attr("r", 10)
            .attr("fill", "red")
            .on("click", () => highlightTrajectory(piece));
    });

    function highlightTrajectory(pieceID) {
        svg.selectAll("path").remove();
        const filteredData = data.filter(d => d.trajectoryID === pieceID);

        const line = d3.line()
            .x(d => d.cx)
            .y(d => d.cy);

        svg.selectAll("path")
            .data([filteredData])
            .enter()
            .append("path")
            .attr("d", line(filteredData))
            .attr("stroke", "blue")
            .attr("stroke-width", 2)
            .attr("fill", "none");
    }
}