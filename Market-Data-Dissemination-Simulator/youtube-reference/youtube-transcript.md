ne idea for example is instead of 
having a console application as the 
client that will just simply print 
subscription requests snapshots what's 
up guys coding Jesus here guys in 
today's video I want to highlight a 
project that I built that should serve 
as an example for people looking to 
break into the space as a junior or as 
an intern quantitative developer or 
software engineer that firms are looking 
for all right if you go on oper website 
you look at that intern position you'll 
see that they're looking for people that 
show passion for software engineering 
not just in school but also outside of 
school so I'm hoping that this example 
that I'm going to be communicating with 
you guys today will serve as a very good 
foundational example for what these 
companies are looking for before we get 
into what the actual project is I want 
to talk about why I decided to build 
this project in particular and that is 
because a lot of people miss this one 
skill that this project highlights okay 
what is that skill well when I talk to 
people in my one-on-one consultation 
sessions a lot of them don't understand 
the concept of client server communic 
ation in the context of microservice 
architecture and distributed 
asynchronous systems what do I mean by 
that I just threw a whole bunch of 
buzzwords at you you're probably like 
coding Jesus I have no idea what you're 
talking about let me break this down 
very simply imagine you have a server 
responsible for computing a lot of 
information a lot of people at the 
intern level still in school they know 
how to produce programs that will spit 
out numbers but they don't know how to 
produce programs that will spit out 
numbers and spit those numbers out in a 
data stream to another application that 
application might be a front that that 
will be displaying that data or it might 
be another server that's responsible for 
transforming that data even further all 
right so they're missing that cross 
application communication layer 
understanding or sometimes what we call 
in the industry middleware okay they're 
missing that understanding of middleware 
how middleware Works what are examples 
of middleware Etc that's why for this 
project I decided to build a market data 
dissemination simulator that uses grpc 
which is an open- source a remote 
procedure call framework developed by 
Google to uh use to build really 
scalable cross service apis all right 
now what does this project look like now 
let's get into actual project itself 
this project looks like two applications 
okay one is a server and one is a client 
before I speak about what's in each one 
of these I'm going to mention guys that 
I'll be putting the code up here on the 
screen so that you can see but if you 
want to see the entire code on GitHub 
you need to become a patron okay go down 
to my patreon link in the description 
box below you'll see all the code that 
youd love okay cuz I know that there's 
going to be somebody watching this video 
before I even get 30 seconds into this 
video they'll be like where's the code 
where's the code okay that's where the 
code is all right now let's talk about 
the actual concept itself because what's 
more important than where's the code is 
understanding what the codee's doing so 
that if somebody asks you to do 
something similar you can do so easily 
all right okay let's talk about the 
first application the server the server 
is responsible for doing a couple of 
things let's talk about this in order 
the the first thing the server was 
responsible for doing is reading a 
configuration file that contains 
instruments and their contract 
specifications all right for the purpose 
of this simple example I did two 
instruments and I specified only three 
pieces of important information their ID 
their symbol which I never actually 
ended up using and the contract 
specification which just had a single 
field called order book depth the order 
book depth simply says how many levels 
on the bids and the asks do I want to 
disseminate to clients okay after the 
configuration file was read I 
instantiated a server object a order 
book manager and an order book class 
that are responsible for amongst each 
other generating order book updates 
getting snapshots for newly connected 
clients and disseminating both snapshots 
and incremental updates what does that 
look like well when an order book is 
created for an instrument that was 
loaded from the configuration file what 
will happen is that we slowly start 
building the order book and I will have 
a process that will mimic actual real 
life trading events so for example for a 
given price level on the bids or the 
asks I can either replace an existing 
level remove an existing level like the 
level got deleted for example somebody 
had their bids there and they pulled and 
they were the only person on that level 
and the entire level disappeared and if 
the order book's empty of course the 
only thing you can do is add new levels 
as I add more levels the likelihood of 
removing a level increases because 
obviously you can't remove a level if 
there is nothing in the order book all 
right hopefully that makes sense now 
what I also decided to do was H build a 
subscription mechanism in which a client 
will connect and when they connect and 
specify an instrument ID on that initial 
connection they will initially be sent a 
snapshot of the current state and then 
they will receive a stream of 
incremental updates that they will need 
to apply onto their original snapshots 
now this is done for efficiency purposes 
you don't want to send the entire state 
of the order book to every client every 
time there's a change to the order book 
now the actual streaming protocol that I 
used here for grpc was a bidirectional 
stream in which a client can 
continuously send new subscription and 
unsubscription requests for various 
instruments and then read a stream 
of both snapshots and incremental 
updates I also wanted to simulate kind 
of different types of state so for 
example if for example there is some 
event that causes a new snapshot to 
disseminate a new snapshot can be 
created randomly in the middle of the 
Stream and the client will need to 
handle that snapshot by clearing its own 
state of incremental or or snapshot plus 
incremental updates and taking that new 
snapshot as gospel taking that new 
snapshot as the current state of the 
order book now what I decided to do as 
well on the unsubscribe and these are 
all designed decisions guys this doesn't 
mean that this is the gold standard this 
is the way that I've learned to do it 
based off my own experience what I 
decided to do on the unsubscribe is not 
just simply stop the stream of 
incremental un snapshot updates coming 
to the client but I also also decided to 
have the server send an empty snapshot 
to signify that the client should clear 
its cash of any existing snapshot State 
all right for that order book so that's 
what I decided to do in building this 
project 
now now I know I'm going to hear 
somebody in the comment section that's 
going to be like well this is so easy I 
can do this in 30 
minutes okay if you think it's easy 
that's great the purpose of whether this 
is easy or difficult isn't the point the 
purpose is how can you impress an 
employer and if you think you can do 
this in 30 minutes or 1 hour or it's too 
easy for you go ahead and make it harder 
make it difficult to the point where you 
as an individual believe that it is 
worthy enough to impress a potential 
interviewer I think where I stopped 
right now is more than enough but if 
You' like to take a step further you can 
do a couple of different things I'm 
going to give you guys two ideas in this 
video one idea for example is instead of 
having a console application as the 
client that will just print subscription 
requests snapshots incremental State and 
unsubscription requests why don't you 
build a front end that actually 
visualizes this order book that can show 
cumulative size that can show prices 
right something that you can maybe 
consume visually as opposed to needing 
to read from a console another example 
of how to make this project even better 
for example is to build another server 
application that acces a client that is 
responsible for receiving all updates 
for all instruments and persisting this 
information in a database so you have 
another service another kind of like 
microarchitecture like service that's 
solely responsible for persisting these 
updates in a database it could be 
Cassandra it could be my SQL it could be 
Etc but guys the theme of this video is 
threefold one is understanding 
middleware grpc Etc building those 
scalable 
apis distributed asynchronous systems in 
the context of Market data dissemination 
and making your own architectural 
decisions and justifying them cuz I can 
come and tell you yeah use my SQL I can 
come and tell you use dolphin DB I can 
come and tell you use Cassandra or 
mongod DB but at the end of the day when 
you're in that interview and you're 
highlighting this project the 
interviewer is going to ask you why do 
you use this instead of that so this is 
the point where after understanding the 
project maybe you've read through the 
original source code or youve kind of 
understood the little Snippets that I 
placed on this video you now take a step 
back and say how can I make this better 
and why do I want to go in this 
direction as opposed to that 
direction all right guys I hope this 
video was useful I hope you were able to 
learn from it once again if you'd like 
to speak to me oneon-one my calendar 
link is in the description box below you 
can go ahead and book a session if you'd 
like to see all the code in its entirety 
become a patron we do monthly calls you 
we have access to a Discord that's 
exclusive where I communicate with a lot 
of you guys and you gain access to the 
code as I mentioned and if you'd like to 
follow my life behind the scenes guys my 
life is not just Quan stuff I literally 
post nothing on my Instagram so if you'd 
like to follow me on Instagram you can 
do so at the coding Jesus at coding 
jesus.com I'm tired I'm tripping over my 
words thanks for watching this video 
guys cheers 
 - Generated with https://kome.ai