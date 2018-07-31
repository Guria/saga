array: [
  [1, 2],
  [3, 4]
]





<array: [
  [1, 2],
  [3, 4]
]>

1. array

<[
  [1, 2],
  [3, 4]
]>

1. []
<[1, 2]>
<[3, 4]>

2. []
<1>
<2>
<3>
<4>

---

<array: [
  [[1], [2]],
  [[3], [4]]
]>

1. array

<[
  [[1], [2]],
  [[3], [4]]
]>

2. []

<[[1], [2]]>,
<[[3], [4]]>

3. []
<[1]>
<[2]>
<[3]>
<[4]>

4. []
<1>
<2>
<3>
<4>


<[{parents: [{children:[{names: ['arne']}]}]}, {parents: [{children:[{names: ['bjarne']}]}]}]>

=> [...]

<{parents: [{children:[{names: ['arne']}]}]}>, <{parents: [{children:[{names: ['bjarne']}]}]}>

=> parents

<[{children:[{names: ['arne']}]}]>, <[{children:[{names: ['bjarne']}]}]>

=> []

<{children:[{names: ['arne']}]}>, <{children:[{names: ['bjarne']}]}>

=> children

<[{names: ['arne']}]>, <[{names: ['bjarne']}]>

=> []
<{names: ['arne']}>, <{names: ['bjarne']}>

=> names

<['arne']>, <['bjarne']>

som pakkes ut til

[['arne'], ['bjarne']]



<{parents: [{children: [{name: 'arne'}]}]}>

=> parents

<[{children: [{name: 'arne'}]}]>

=> []

[<{children: [{name: 'arne'}]}>]

=> children

[<[{name: 'arne'}]>]

=> []

[<{name: 'arne'}>]

=> name

[<'arne'>]

