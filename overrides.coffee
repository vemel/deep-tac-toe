###
Add all properties of one object to another

@param {Object} from
@return {Object}
###

Object.defineProperty Object::, "extend", {
    enumerable : off,
    value      : (from) ->
      for name in Object.getOwnPropertyNames from
          description = Object.getOwnPropertyDescriptor from, name
          Object.defineProperty @, name, description
      @
  }