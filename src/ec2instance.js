var AWS = require('aws-sdk')
var config = require('config')
const fs = require('fs')
require('dotenv').load()
AWS.config.update({
  'region': config.region,
  'apiVersion': config.apiVersion
})

var ec2

function createEC2 (awsProfile, nodeEnv, keyName, createNewKey) {
  if (awsProfile !== 'default') {
    AWS.config.update({
      'accessKeyId': process.env.accessKeyId,
      'secretAccessKey': process.env.secretAccessKey
    })
  }
  ec2 = new AWS.EC2()
  // Create EC2 service object
  var sgParams = {
    Description: config.sg.GroupName, /* required */
    GroupName: config.sg.GroupName + new Date().getTime()
  }

  // creating security group
  console.log('Creating secrutiy group')
  ec2.createSecurityGroup(sgParams, function (err, data) {
    if (err) console.log(err, err.stack) // an error occurred
    else {
      var sgRules = config.sg.sgRules
      sgRules.GroupId = data.GroupId
      ec2.authorizeSecurityGroupIngress(sgRules, function (err, data) {
        if (err) console.log(err, err.stack) // an error occurred
        else {
          var params = {
            KeyName: keyName
          }
          if (createNewKey) {
            console.log('generating new key')
            ec2.createKeyPair(params, function (err, data) {
              if (err) console.log(err, err.stack) // an error occurred
              else {
                console.log('Generated new aws keys. Please save it because you wont be able to retrieve it again')
                console.log(data)
                launchEC2(config.amiId[nodeEnv], keyName, sgRules.GroupId)
              }
            })
          } else {
            launchEC2(config.amiId[nodeEnv], keyName, sgRules.GroupId)
          }
        }
      })
    }
  })
}

function launchEC2 (amiId, keyName, groupId) {
  var userData = fs.readFileSync('./src/userData.txt').toString()
  userData = Buffer.from(userData).toString('base64')
  var params = {
    ImageId: amiId,
    InstanceType: 't2.medium',
    MinCount: 1,
    MaxCount: 1,
    UserData: userData,
    KeyName: keyName,
    SecurityGroupIds: [groupId],
    TagSpecifications: [
      {
        ResourceType: 'instance',
        Tags: [
          { Key: 'Name', Value: 'MetronomeRopstenMorden' }
        ]
      }
    ]
  }
  console.log('creating EC2 instance and spining up ETH, ETC node')
  ec2.runInstances(params, function (err, data) {
    if (err) {
      console.log(err)
    }
    var instanceId = data.Instances[0].InstanceId
    console.log('Created instance', instanceId)
    ec2.describeInstances({ InstanceIds: [instanceId] }, function (err, data) {
      if (err) {
        console.log(err)
      }
      console.log('Successfully launched instance. Public DNS is')
      console.log(data.Reservations[0].Instances[0].PublicDnsName)
      console.log('Connect ETH node on')
      console.log('http://' + data.Reservations[0].Instances[0].PublicDnsName + ':8545')
      console.log('ws://' + data.Reservations[0].Instances[0].PublicDnsName + ':8546')
      console.log('Connect ETC node on')
      console.log('http://' + data.Reservations[0].Instances[0].PublicDnsName + ':8555')
      console.log('ws://' + data.Reservations[0].Instances[0].PublicDnsName + ':8556')
    })
  })
}

module.exports = { createEC2 }
