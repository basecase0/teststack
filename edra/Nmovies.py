import requests
from bs4 import BeautifulSoup
from collections import defaultdict

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0",
    "Accept-Encoding": "gzip, deflate",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "DNT": "1",
    "Connection": "close",
    "Upgrade-Insecure-Requests": "1"
}

# Fetch the top N movies from IMDb Top 250 chart
def fetch_top_n_movies(n):
    url = 'https://www.imdb.com/chart/top/'
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    get_html = soup.find_all('div', class_='sc-b189961a-0 iqHBGn cli-children')

    # Get the top N movies
    movies = []
    # for item in soup.select('.lister-list tr')[:n]:
    #     title_column = item.select_one('.titleColumn a')
    #     movie_title = title_column.text
    #     movie_url = 'https://www.imdb.com' + title_column['href']
    #     movies.append((movie_title, movie_url))
    i=0
    for html in get_html:

        # movie_dic = {}
        # Movie Name
        movie_name = html.find('h3', class_='ipc-title__text')
        movie_title = movie_name.text.strip() if movie_name else 'unknown movie name'
        link= html.find('a',class_='ipc-title-link-wrapper')
        
        movie_url=link['href']
        # print(movie_url)
        movies.append((movie_title,movie_url))
        i=i+1
        if(i>=n):
            break
    return movies

# Parse the individual movie page to get the cast information
def fetch_cast(movie_url):
    response = requests.get('https://www.imdb.com'+movie_url,headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')

    get_html = soup.find_all('div', class_='sc-bfec09a1-7 kSFMrr')

    # Extract the cast names
    cast_list = []
    # for cast_item in soup.select('.cast_list tr .primary_photo + td a'):
    #     cast_name = cast_item.text.strip()
    #     if cast_name:
    #         cast_list.append(cast_name)
    # return cast_list
    for html in get_html:
        name=html.find('a',class_='sc-bfec09a1-1 KeEFX')
        # print(name)
        cast_name= name.text.strip() if name else 'unknown cast name'
        if cast_name:
            cast_list.append(cast_name)
    return cast_list


# Build the knowledge base
def build_knowledge_base(n):
    movies = fetch_top_n_movies(n)
    knowledge_base = defaultdict(list)

    for movie_title, movie_url in movies:
        cast_list = fetch_cast(movie_url)
        for actor in cast_list:
            knowledge_base[actor].append(movie_title)

    return knowledge_base

# Query the knowledge base
def query_knowledge_base(knowledge_base, actor_name, m):
    if actor_name in knowledge_base:
        return knowledge_base[actor_name][:m]
    else:
        return []

# Main program
def main():
    # Input: Number of top movies to scrape
    n = int(input("Enter the number of top movies to scrape (N): "))
    
    # Build the knowledge base
    print("Building the knowledge base...")
    knowledge_base = build_knowledge_base(n)
    print("Knowledge base built successfully!")
    # print(knowledge_base)
    # Query the knowledge base
    while True:
        actor_name = input("Enter actor's name to query (or 'exit' to quit): ")
        if actor_name.lower() == 'exit':
            break
        m = int(input(f"Enter the number of top movies to return for {actor_name} (M): "))
        top_movies = query_knowledge_base(knowledge_base, actor_name, m)
        if top_movies:
            print(f"Top {m} movies for {actor_name}: {', '.join(top_movies)}")
        else:
            print(f"No movies found for {actor_name}")

if __name__ == "__main__":
    main()
