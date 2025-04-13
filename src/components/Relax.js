import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Title from './Title';
import BrowserButton from './BrowserButton';
import { FaUmbrellaBeach } from "react-icons/fa6";

const Relax = () => {
    const { t } = useTranslation();

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
            <Title icon={<FaUmbrellaBeach size={24} />} text={t('relax')} />


                <BrowserButton
                    link="https://playpager.com/embed/sudoku/index.html"
                    buttonText="Sudoku"
                    variant="info"
                />
                <BrowserButton
                    link="https://playpager.com/embed/domino-game/"
                    buttonText="Domino"
                    variant="info"
                />
                <BrowserButton
                    link="https://playpager.com/embed/battleship/"
                    buttonText="Battleship"
                    variant="info"
                />
                <BrowserButton
                    link="https://playpager.com/embed/mahjong/"
                    buttonText="Mahjong"
                    variant="info"
                />
                <BrowserButton
                    link="https://playpager.com/embed/falling-cubes/"
                    buttonText="Cubes"
                    variant="info"
                />
                <BrowserButton
                    link="https://playpager.com/embed/pool-billiards/"
                    buttonText="Billiard"
                    variant="info"
                />
                <BrowserButton
                    link="https://playpager.com/embed/baseball-titan/"
                    buttonText="Baseball"
                    variant="info"
                />
                <BrowserButton
                    link="https://playpager.com/embed/snake/"
                    buttonText="Snake"
                    variant="info"
                />
                <BrowserButton
                    link="https://playpager.com/embed/brick-breakout/"
                    buttonText="Breakout"
                    variant="info"
                />
                <BrowserButton
                    link="https://playpager.com/embed/blackjack-game/"
                    buttonText="blackjack"
                    variant="info"
                />
                <BrowserButton
                    link="https://www.youtube.com/embed/videoseries?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG"
                    buttonText="Music"
                    variant="primary"
                    size="sm"
                />


        </div>
    );
}

export default Relax;