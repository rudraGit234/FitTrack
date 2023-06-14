'use strict';

// prettier-ignore


class Workout {
    date = new Date();
    id = Date.now().toString().slice(-10)
    clicks = 1;

    constructor(coords, distance, duration) {
        this.coords = coords// an array of lang and lat
        this.distance = distance
        this.duration = duration

    }

    _setDescription() { // to get the date whenever a new object is made
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }

    click() {
        this.clicks++
    }

}

class Running extends Workout {
    type = "running";
    // wwith extend we can use the properties of workout  classes here
    constructor(coords, duration, distance, cadence) {
        super(coords, duration, distance)// intitalises the this keyword of the oarent class
        this.cadence = cadence
        this.calcPace()// 
        this._setDescription()


    }

    calcPace() {
        //min/km

        this.pace = this.duration / this.distance
        return this.pace
    }
}

class Cycling extends Workout {
    type = "cycling";
    constructor(coords, duration, distance, elevationgains) {
        super(coords, duration, distance, elevationgains)// intitalises the this keyword of the oarent class
        this.elevationgains = elevationgains
        this.calcSpeed()
        this._setDescription()


    }

    calcSpeed() {
        //km/hr
        this.speed = this.distance / (this.duration / 60)
        return this.speed
    }
}


const run1 = new Running([1, 2], 2, 60, 30)
console.log(run1);
///////////////////////////////////////////////////////
//APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class App {
    #map;
    #mapEvent
    #mapZoomLevel = 13;
    #workouts = []
    constructor() {
        // Get user position 
        this._getPosition();// immediately gets executed because the app object(instance) is created, makes code more organised

        //Get data from local storage
        this._getLocalStorage()

        //Event handlers
        form.addEventListener("submit", this._newWorkout.bind(this))// here submit is triggered when i click the enter key in my keyboard
        inputType.addEventListener("change", this._toggleElevationField)
        // we need to use the .bind(this) for the this inside the event handler function to point to the app class because this doesn't work in a normal function 
        // by toggling the same class on both the elements its always one of them hidden and another visible
        containerWorkouts.addEventListener("click", this._moveToPopup.bind(this))





    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {//here we used this becaus it is inisde a class, this points to the class. 
                alert("Could not find the location")
            }
            )

    }

    _loadMap(position) {
        // console.log(position);
        const { latitude } = position.coords
        const { longitude } = position.coords
        console.log(`https//www.google.com/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude]

        //getting the map inside a div
        // L here is the main function 
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
        L.tileLayer("https://tile-c.openstreetmap.fr/hot/{z}/{x}/{y}.png"
            , {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);


        //handling map clicks
        this.#map.on("click", this._showForm.bind(this)) // this is also an event handler function so need to use this in bind

        this.#workouts.forEach(work =>
            this._renderWorkoutMarker(work))
    }


    _showForm(mapE) {
        this.#mapEvent = mapE
        form.classList.remove("hidden")
        inputDistance.focus();
    };

    _hideForm() {
        //Empty inputs
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = ""
        form.style.display = "none"
        form.classList.add("hidden")
        setTimeout(() => {
            form.style.display = "grid", 1000
        })

    }


    _toggleElevationField() {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden")
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden")

    }


    _newWorkout(e) {
        // helper function
        const validInputs = (...inputs) =>
            inputs.every(inp =>
                Number.isFinite(inp)
            )


        const allPositive = (...inputs) =>
            inputs.every(inp =>
                inp > 0
            )



        e.preventDefault()// to prevent the default form behaviour which reloads the page


        //get data from form
        const type = inputType.value
        const distance = +inputDistance.value // + here converts a a string to a number
        const duration = +inputDuration.value
        const { lat, lng } = this.#mapEvent.latlng
        let workout;

        //if workout running then create running object
        if (type === "running") {
            const cadence = +inputCadence.value
            //check if data is valid
            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence))
                // if all of the field mwntioned here are true then only this will become true
                // !Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence) {
                return alert("Inputs have to be positive numbers and numericals!!")


            workout = new Running([lat, lng], distance, duration, cadence)
        }


        //if workout cycling then create a cycling obejct
        if (type === "cycling") {
            const elevation = +inputElevation.value

            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration))  // elevation can be negativr
                return alert("Inputs have to be positive numbers!!")

            workout = new Cycling([lat, lng], distance, duration, elevation)

        }

        //add the new object in workout array
        this.#workouts.push(workout)



        //render workout on map as a marker
        this._renderWorkoutMarker(workout)


        //render workout on list
        this._renderWorkout(workout)

        //hide form + clear input fields
        this._hideForm()

        //Sert local storage to all workouts
        this._setLocalStorage()



    }


    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250, minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,// type is no loger defined here becuase of the scope
            })
            )
            .setPopupContent(`${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}${workout.description}`)
            .openPopup();

    }

    _renderWorkout(workout) {


        // The common part of the html where we can use ternary code 
        // the data-id is the custom attribute to the li element which we will access with dataset property to get the id value in as an object
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          `;

        if (workout.type === "running")

            html +=
                `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
         </li>`

        if (workout.type === "cycling")
            html += `
         <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout_s_unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationgains}</span>
            <span class="workout__unit">m</span>
          </div>
         </li>`;


        form.insertAdjacentHTML("afterend", html)
    }


    _moveToPopup(e) {

        const workoutEl = e.target.closest(".workout")
        // console.log(workoutEl);
        if (!workoutEl) return

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id)// this will give out the workout array element which matches the id of the data id attrtibute
        // console.log(workout);

        // moving the map to the coords of the workout object above

        this.#map.setView(workout.coords, this.#mapZoomLevel,
            {
                animate: true,// heps to get the slow motion delay of 1 sec
                pan: {
                    duration: 1
                }
            })// this method zooms in to the specified coordianted locaton 


        // using the public interface
        // workout.click() because the prototype is gone

    }


    _setLocalStorage() {
        localStorage.setItem("workouts", JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        // helps to retrive the storage
        const data = JSON.parse(localStorage.getItem("workouts")) //string now object
        // console.log(data);

        if (!data) return

        this.#workouts = data; //at this point the workout array is empty since the workout object is not in existence when this will be rendered
        this.#workouts.forEach(work =>
            this._renderWorkout(work) // objects coming from local storage will not inherit the methods that they did before
        );
    }


    // deletingf all the previous workouts
    reset() {
        localStorage.removeItem("workouts")
        location.reload()// reloading the page programtically
    }
}



// getting the current coordinates



const app = new App()// using the app methods in constructor for better organisation of code, whenever a new object is created the methods in contructor are automatically executed

