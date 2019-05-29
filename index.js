'use strict'
var inquirer = require('inquirer')
const EC2Instance = require('./src/ec2instance.js')
var questionsSet1 = [
  {
    type: 'list',
    name: 'nodeEnv',
    message: 'Select node environment of eth, etc. Testnet will spin up ropsten(ETH) and morden(ETC).',
    choices: ['testnet', 'mainnet']
  },
  {
    type: 'list',
    name: 'awsprofile',
    message: 'Select AWS credential profile.',
    choices: ['default', 'I have set keys as environment variable']
  },
  {
    type: 'confirm',
    name: 'generateKey',
    message: 'Do you want to create new key pair'
  },
  {
    type: 'input',
    name: 'keyName',
    message: 'Please enter key name'
  }
]

inquirer.prompt(questionsSet1).then(answers => {
  console.log(JSON.stringify(answers, null, '  '))
  EC2Instance.createEC2(answers.awsprofile, answers.nodeEnv, answers.keyName, answers.generateKey)
})
