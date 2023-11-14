function visualize_line(data) {
    data = parse(data);
    //draw_line(data, myscale(data));
    add_axes(myscale(data));
}

function parse(data) {
    let parse_time = d3.timeParse("%Y %b");
    let groupedData = data.reduce((acc, cur) => {
        if (cur.date === 'NA' || cur.calfresh === 'NA') {
            return acc;
        }
        cur.date = parse_time(cur.date);
        if (!acc[cur.county]) {
            acc[cur.county] = [];
        }
        acc[cur.county].push(cur);
        return acc;
    }, {});

    return Object.values(groupedData);
}

function draw_line(county, data, myscale) {
    let line = d3.line()
        .x(d => myscale.x(d.date))
        .y(d => myscale.y(d.calfresh));

    let paths = d3.select("svg")
                  .select("#series")
                  .selectAll("path")
                  .data(data, d => d.county);

    paths.enter()
         .append("path")
         .attr("id", county)
         .attr("stroke", "darkblue")
         .attr("stroke-width", 2)
         .attr("fill", "none");

    paths.transition()
         .duration(500)
         .attr("d", line);

    paths.exit().remove();
}


function add_axes(myscale) {
    let x_axis = d3.axisBottom()
        .scale(myscale.x),
        y_axis = d3.axisLeft()
            .scale(myscale.y);

    d3.select("#axes")
        .append("g")
        .attrs({
            id: "x_axis",
            transform: `translate(0,${height - margins.bottom})`
        })
        .call(x_axis);

    d3.select("#axes")
        .append("g")
        .attrs({
            id: "y_axis",
            transform: `translate(${margins.left}, 0)`
        })
        .call(y_axis)
}

function myscale(data) {
    let flattenedData = data.flat();
    let y_max = d3.max(flattenedData, d => +d.calfresh),
        x_extent = d3.extent(data[0].map(d => d.date));

    return {
        x: d3.scaleTime()
            .domain(x_extent)
            .range([margins.left, width - margins.right]),
        y: d3.scaleLinear()
            .domain([0, y_max])
            .range([height - margins.bottom, margins.top])
    }
}

function updateLineChart(selectedCounty) {
    let filteredData = originalData.filter(d=> d[0].county === selectedCounty);
    updateYAxis(myscale(filteredData));
    draw_line(selectedCounty, filteredData, myscale(filteredData));
}

function updateYAxis(myscale) {
    let y_axis = d3.axisLeft().scale(myscale.y),
        yAxisElement = d3.select("#axes").selectAll("#y_axis").data([0]);
    let yAxisEnter = yAxisElement.enter().append("g").attr("id", "y_axis");
    yAxisElement = yAxisEnter.merge(yAxisElement);

    yAxisElement.transition()
        .duration(500)
        .ease(d3.easeExp)
        .call(y_axis)
        .attr("transform", `translate(${margins.left}, 0)`);
}


function visualize_choropleth(data) {
    originalData = parse(data[1]);
    data = c_parse(data);
    let proj = d3.geoMercator()
        .fitSize([600, 600], data)
    let path = d3.geoPath()
        .projection(proj);

    d3.select("#map")
        .selectAll("path")
        .data(data.features).enter()
        .append("path")
        .attrs({
            "d": d => path(d),
            "fill": d => d3.interpolateBlues(d.properties.calfresh_avg / 200000),
            "stroke-width": 0.1,
            "stroke": "black"
        })
        .on("mouseover", function(event, d) {
            let selectedCounty = d.properties.COUNTY_NAME;
            updateLineChart(selectedCounty);
        })
}

function c_parse(data) {
    let geojsonData = data[0];
    let csvData = data[1];

    let calfreshAvgByCounty = {};
    csvData.forEach(function (d) {
        calfreshAvgByCounty[d.county] = calfreshAvgByCounty[d.county] || [];
        if (!isNaN(d.calfresh)) {
            calfreshAvgByCounty[d.county].push(+d.calfresh);
        }
    });

    for (let county in calfreshAvgByCounty) {
        calfreshAvgByCounty[county] = d3.mean(calfreshAvgByCounty[county]);
    }

    geojsonData.features.forEach(function (feature) {
        let county = feature.properties.COUNTY_NAME;
        feature.properties.calfresh_avg = calfreshAvgByCounty[county] || 0;
    });

    return geojsonData;
}

let width = 900,
    height = 500,
    margins = { top: 50, bottom: 50, left: 50, right: 50 }
d3.csv("https://raw.githubusercontent.com/kcui23/stat679/main/ps3/calfresh-small.csv")
    .then(visualize_line)
Promise.all([d3.json("https://raw.githubusercontent.com/kcui23/stat679/main/ps3/California_County_Boundaries.geojson"),
d3.csv("https://raw.githubusercontent.com/kcui23/stat679/main/ps3/calfresh-small.csv")])
    .then(visualize_choropleth)