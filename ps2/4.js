let bar_ages = [],
    generator = d3.randomUniform(0, 500),
    id = 0;

function update() {
    bar_ages = bar_ages.map(d => { return {id: d.id, age: d.age + 1, height: d.height }})
    bar_ages.push({age: 0, height: generator(), id: id});
    bar_ages = bar_ages.filter(d => d.age < 5)
    id += 1;
}

function update_vis() {
    update()
    d3.select("svg")
	.selectAll("rect")
	.data(bar_ages, d => d.id)
	.join(
	    enter => enter.append("rect")
		.attr("y", 500)
		.transition()
		.duration(750)
		.attrs({
		    x: d => d.age * 100,
		    y: d => 500 - d.height,
		    width: 70,
		    height: d => d.height
		}),
	    update => update
		.transition()
		.duration(750)
		.attrs({
		    x: d => d.age * 100,
		    y: d => 500 - d.height,
		    width: 70,
		    height: d => d.height
		}),
	    exit => exit
		.transition()
	    .duration(750)
		.attrs({
		    x: 500,
		    y: 500,
		    height: 0,
		    width: 0
		})
		.remove()
	)
    
}

// wait for dom loading
document.addEventListener('DOMContentLoaded', function() {
    d3.select("button").on("click", update_vis);
})
