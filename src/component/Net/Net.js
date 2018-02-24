import 'whatwg-fetch'
export default class Net {

  /**
   * checks http status & response
   * @param  {object} response
   * @return {object} returns response, or throws error
   */

  checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response
    } else {
      var error = new Error(response.statusText)
      error.response = response
      throw error
    }
  }


  /**
   * parse JSON response
   * @param  {object} response
   * @return {object} response JSON
   */

  parseJson(response) {
    return response.json()
  }


  /**
   * Perform request using fetch
   * @return {Promise}
   */

  static request(url, body) {
    return new  Promise((resolve, reject) => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      .then(this.checkStatus)
      .then(this.parseJson)
      .then(function(data) {
        resolve(data)
      }).catch(function(error) {
        reject(error)
      })
    })
  }

}
