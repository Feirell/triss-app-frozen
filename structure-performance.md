```text
                           ops/sec  MoE samples relative
for 10 elements
  get
    EdgeDataAttachment   2,458,524 1.63      91     1.00
    SimplerVersion     605,407,649 0.54      91   246.25
    WeakMapVersion       5,902,094 1.28      91     2.40
    SimpleIdAttach      75,541,788 0.93      90    30.73
  set
    EdgeDataAttachment   2,461,316 1.06      86     1.30
    SimplerVersion       1,886,375 1.54      89     1.00
    WeakMapVersion       3,056,902 1.47      85     1.62
    SimpleIdAttach      40,776,592 0.87      92    21.62
for 100 elements
  get
    EdgeDataAttachment   2,592,754 0.77      88     1.00
    SimplerVersion     581,785,461 0.57      88   224.39
    WeakMapVersion       5,749,694 1.04      90     2.22
    SimpleIdAttach      75,622,542 0.93      91    29.17
  set
    EdgeDataAttachment   2,339,190 3.32      86     1.84
    SimplerVersion       1,269,753 2.81      81     1.00
    WeakMapVersion       2,687,800 1.20      90     2.12
    SimpleIdAttach      40,669,758 0.86      93    32.03
for 1000 elements
  get
    EdgeDataAttachment   2,199,645 2.56      85     1.00
    SimplerVersion     520,094,691 9.30      89   236.44
    WeakMapVersion       5,058,907 2.36      84     2.30
    SimpleIdAttach      70,466,772 2.54      87    32.04
  set
    EdgeDataAttachment   2,220,193 2.41      86     2.23
    SimplerVersion         996,085 0.89      91     1.00
    WeakMapVersion       2,570,310 1.87      79     2.58
    SimpleIdAttach      37,595,148 1.63      87    37.74
```

```text
Memory for EdgeDataAttachment
  Heap initial 41,083,584bytes
  Heap after 153,221,328bytes
  Delta after 112,137,744bytes

  Possible garbage collection
  Heap after 149,070,592bytes
  Delta after 107,987,008bytes
  Delta to gc -4,150,736bytes

Memory for SimplerVersion
  Heap initial 5,285,456bytes
  Heap after 699,796,400bytes
  Delta after 694,510,944bytes

  Possible garbage collection
  Heap after 699,808,520bytes
  Delta after 694,523,064bytes
  Delta to gc 12,120bytes

Memory for WeakMapVersion
  Heap initial 5,284,808bytes
  Heap after 887,231,808bytes
  Delta after 881,947,000bytes

  Possible garbage collection
  Heap after 882,505,288bytes
  Delta after 877,220,480bytes
  Delta to gc -4,726,520bytes

Memory for SimpleIdAttach
  Heap initial 77,442,384bytes
  Heap after 78,400,464bytes
  Delta after 958,080bytes

  Possible garbage collection
  Heap after 78,414,368bytes
  Delta after 971,984bytes
  Delta to gc 13,904bytes




Memory for EdgeDataAttachment
  Heap initial 41,083,736bytes
  Heap after 153,221,880bytes
  Delta after 112,138,144bytes

  Possible garbage collection
  Heap after 149,071,200bytes
  Delta after 107,987,464bytes
  Delta to gc -4,150,680bytes

Memory for SimplerVersion
  Heap initial 5,324,648bytes
  Heap after 699,741,848bytes
  Delta after 694,417,200bytes

  Possible garbage collection
  Heap after 699,753,968bytes
  Delta after 694,429,320bytes
  Delta to gc 12,120bytes

Memory for WeakMapVersion
  Heap initial 5,275,112bytes
  Heap after 887,323,432bytes
  Delta after 882,048,320bytes

  Possible garbage collection
  Heap after 882,607,072bytes
  Delta after 877,331,960bytes
  Delta to gc -4,716,360bytes

Memory for SimpleIdAttach
  Heap initial 77,410,552bytes
  Heap after 78,335,784bytes
  Delta after 925,232bytes

  Possible garbage collection
  Heap after 78,349,744bytes
  Delta after 939,192bytes
  Delta to gc 13,960bytes
```

```text
Memory for EdgeDataAttachment
  Heap initial 41,126,192bytes
  Heap after 153,538,200bytes
  Delta after 112,412,008bytes
  Garbage collecting

  Possible garbage collection
  Heap after 149,260,680bytes
  Delta after 108,134,488bytes
  Delta to gc -4,277,520bytes

Memory for SimplerVersion
  Heap initial 5,293,240bytes
  Heap after 699,765,384bytes
  Delta after 694,472,144bytes
  Garbage collecting

  Possible garbage collection
  Heap after 691,846,624bytes
  Delta after 686,553,384bytes
  Delta to gc -7,918,760bytes

Memory for WeakMapVersion
  Heap initial 5,330,696bytes
  Heap after 887,009,592bytes
  Delta after 881,678,896bytes
  Garbage collecting

  Possible garbage collection
  Heap after 882,343,992bytes
  Delta after 877,013,296bytes
  Delta to gc -4,665,600bytes

Memory for SimpleIdAttach
  Heap initial 77,462,672bytes
  Heap after 78,305,568bytes
  Delta after 842,896bytes
  Garbage collecting

  Possible garbage collection
  Heap after 76,569,672bytes
  Delta after -893,000bytes
  Delta to gc -1,735,896bytes

Memory for EdgeDataAttachment
  Heap initial 41,126,192bytes
  Heap after 153,250,096bytes
  Delta after 112,123,904bytes
  Garbage collecting

  Possible garbage collection
  Heap after 149,140,432bytes
  Delta after 108,014,240bytes
  Delta to gc -4,109,664bytes

Memory for SimplerVersion
  Heap initial 5,309,704bytes
  Heap after 699,780,768bytes
  Delta after 694,471,064bytes
  Garbage collecting

  Possible garbage collection
  Heap after 691,805,568bytes
  Delta after 686,495,864bytes
  Delta to gc -7,975,200bytes

Memory for WeakMapVersion
  Heap initial 5,298,984bytes
  Heap after 886,523,592bytes
  Delta after 881,224,608bytes
  Garbage collecting

  Possible garbage collection
  Heap after 881,774,464bytes
  Delta after 876,475,480bytes
  Delta to gc -4,749,128bytes

Memory for SimpleIdAttach
  Heap initial 77,425,184bytes
  Heap after 78,310,544bytes
  Delta after 885,360bytes
  Garbage collecting

  Possible garbage collection
  Heap after 76,637,392bytes
  Delta after -787,792bytes
  Delta to gc -1,673,152bytes
```
