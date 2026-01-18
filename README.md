# WheelDo

TODO App: (name: WheelDo)

- Login (only SSO)
    - GitHub login (Auth.js/NextAuth for GitHub SSO)

Vercel: web app

- Next.js web app.

Parameters for the todo:

- Title
- Body
- Time duration (minutes or hours or days)
    - Optional field, 2 different ways:
        - Split it up in morning, afternoon or evening,
        - Or be able to select an more precise time
- The place where the task needs to be completed
- How much effort it takes (scale unknown yet) easyly selectable
- Urgentcy, some kind of levelling (high, medium, low) (default is medium)
    - If it has a deadline. Then it will display or something or screams at you
- Recurrency (like how outlook or calendar works, every week or every day or every other day or every 2 weeks)
- Also have the option to have Dependencys, so you need to do those taks before to be able the close the childs taks. (
  One one level of dept. So mother with children)

You can only be in progress with one task. So you can not be able to do multiple tasks at the same time. So you need to
be able to say that you are doing the task. And then you can only compleet it or say I want an other tasks if you
actually don’t want to do this right now.

Design needs to be clean and modern. With an good UI/UX experience.

Platform features:
Features:

- User profile:
    - From SSO login
    - Able to set your own colour theme
        - Primary, security, accent, (maybe more needs to find out to style the website to your liking)
    -
- Filter options:
    - MINI game idea: Having a the option to do a mini game so say you want to have for example all the todo’s on a
      wheel and then spin the wheel and you get the task what you should do.

- Share todo’s with other people on the platform (sort of invite system)

Technology:
The stack for the App: https://vercel.com/kb/guide/nextjs-prisma-postgres



