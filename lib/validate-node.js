const filterKeyword = e => {
  return (
    ["only", "required", "alo", "follow", "attrsRequired"].indexOf(e) === -1
  );
};

const validateNext = (currentNode, currentValidator) => {
  let returnValue = true;

  // allow passing array to validateNext
  if (Array.isArray(currentNode)) {
    for (let i = 0; i < currentNode.length; i++) {
      const node = currentNode[i];
      returnValue = validateNext(node, currentValidator) && returnValue;
    }
    return returnValue;
  }

  // only fields (required and uniq)
  if (currentValidator.only) {
    // console.log('- entering only');
    for (const key in currentValidator.only) {
      const childValidator = currentValidator.only[key];

      const childNodes = currentNode.getChilds(key);
      if (childNodes.length === 0) {
        currentNode.err(`Tag "${key}" not found below "${currentNode.name}"`);
        /* istanbul ignore next */
        returnValue = false;
      } else {
        returnValue = validateNext(childNodes, childValidator) && returnValue;
      }
    }

    const uniq = currentNode.childs;
    if (uniq.length !== 1) {
      if (uniq.length === 0) {
        currentNode.err(
          `One child of "${Object.keys(
            currentValidator.only
          )}" is needed below "${currentNode.name}", found ${uniq.length}`
        );
      } else {
        const uniqKeys = Object.keys(currentValidator.only);
        if (uniqKeys.length === 1) {
          currentNode.err(
            `Only one "${uniqKeys}" is allowed below "${
              currentNode.name
            }", found ${uniq.length}`
          );
        } else {
          currentNode.err(
            `Your validator seems broken, only one child is allow bellow an Only declaration.`
          );
        }
      }
      /* istanbul ignore next */
      returnValue = false;
    }
  }

  // required fields
  if (currentValidator.required) {
    // console.log('- entering required');
    for (const key in currentValidator.required) {
      const childValidator = currentValidator.required[key];

      const childNodes = currentNode.getChilds(key);
      if (childNodes.length === 0) {
        currentNode.err(`Tag "${key}" not found below "${currentNode.name}"`);
        /* istanbul ignore next */
        returnValue = false;
      } else {
        if (childNodes.length > 1) {
          currentNode.err(
            `Multiples "${key}" found below "${
              currentNode.name
            }". required only one, found ${childNodes.length}`
          );
          /* istanbul ignore next */
          returnValue = false;
        }
        returnValue = validateNext(childNodes, childValidator) && returnValue;
      }
    }
  }

  // uniq fields
  if (currentValidator.uniq) {
    // console.log('- entering uniq');
    const uniq = [];
    for (let i = 0; i < currentNode.childs.length; i++) {
      const newNode = currentNode.childs[i];
      const childValidator = currentValidator.uniq[newNode.name];
      if (childValidator) {
        uniq.push(newNode);
        returnValue = validateNext(newNode, childValidator) && returnValue;
      }
    }
    if (uniq.length !== 1) {
      if (uniq.length === 0) {
        currentNode.err(
          `One child of "${Object.keys(
            currentValidator.uniq
          )}" is needed below "${currentNode.name}", found ${uniq.length}`
        );
      } else {
        const uniqKeys = Object.keys(currentValidator.uniq);
        if (uniqKeys.length === 1) {
          currentNode.err(
            `Your validator seems broken, prefer "only" over uniq if you want on only child`
          );
        } else {
          currentNode.err(
            `Only one child of "${uniqKeys}" is allowed below "${
              currentNode.name
            }", found ${uniq.length}`
          );
        }
      }
      /* istanbul ignore next */
      returnValue = false;
    }
  }

  // alo fields
  if (currentValidator.alo) {
    // console.log('- entering alo');
    const alo = [];
    for (let i = 0; i < currentNode.childs.length; i++) {
      const newNode = currentNode.childs[i];
      const childValidator = currentValidator.alo[newNode.name];
      if (childValidator) {
        alo.push(newNode);
        returnValue = validateNext(newNode, childValidator) && returnValue;
      }
    }
    if (alo.length === 0) {
      currentNode.err(
        `At least one child of "${Object.keys(
          currentValidator.alo
        )}" is needed below "${currentNode.name}", found ${alo.length}`
      );
      /* istanbul ignore next */
      returnValue = false;
    }
  }

  // follow fields
  if (currentValidator.follow) {
    // console.log('- entering follow');
    for (const key in currentValidator.follow) {
      const childValidator = currentValidator.follow[key];
      if (currentNode.childs.length > 0) {
        returnValue =
          validateNext(currentNode.getChilds(key), childValidator) &&
          returnValue;
      }
    }
  }

  // validator for empty contents
  if (Object.keys(currentValidator).filter(filterKeyword).length === 0) {
    if (
      currentNode &&
      currentNode.childs.length === 0 &&
      !currentNode.content
    ) {
      currentNode.err(`No content found in "${currentNode.name}"`);
      /* istanbul ignore next */
      returnValue = false;
    }
  }

  // gestion des attributs requis
  if (currentValidator.attrsRequired) {
    for (const attrName in currentValidator.attrsRequired) {
      const availableValues = currentValidator.attrsRequired[attrName];
      const currentValue = currentNode.getAttrs()[attrName];
      if (currentValue === undefined || currentValue === null) {
        currentNode.err(
          `Required attribute "${attrName}" not found in "${
            currentNode.name
          }" Tag`
        );
        /* istanbul ignore next */
        returnValue = false;
      } else if (
        availableValues &&
        availableValues.indexOf(currentValue) === -1
      ) {
        currentNode.err(`Required attribute "${attrName}" in "${
          currentNode.name
        }" has incorrect value "${currentValue}"
  Allowed values are : ${availableValues}`);
        /* istanbul ignore next */
        returnValue = false;
      }
    }
  }

  return returnValue;
};

module.exports = validateNext;
