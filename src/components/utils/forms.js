
export function createSubmitHandler(cb) {
    return function (evt) {
        if (evt.target.checkValidity()) {
          let data = {};
          for (let i = 0; i<evt.target.elements.length; i++) {
              data[evt.target.elements[i].name] = evt.target.elements[i].value;
          }
          return fetch(evt.target.action, {
            method: 'POST',
            credentials: 'same-origin',
            body: JSON.stringify(data),
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          }).then(response => {
            console.log(response);
            cb(evt);
          });
        }
      }
}
